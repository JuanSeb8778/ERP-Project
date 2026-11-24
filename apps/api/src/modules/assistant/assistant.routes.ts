import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../core/prisma";
import { ok } from "../../core/result";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/requirePermission";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../middleware/asyncHandler";
import { inventoryService } from "../inventory/inventory.service";

/**
 * Key-free, deterministic assistant (AI_DRIVER=none). Answers the example prompts
 * directly from live, tenant-scoped DB data — no hallucinated numbers, works offline.
 * A later phase can swap in a free LLM for natural-language narration.
 */
export const assistantRouter: Router = Router();
assistantRouter.use(authenticate);

interface Answer {
  text: string;
  table?: { columns: string[]; rows: (string | number)[][] };
}

const SUGGESTIONS = [
  "How many pending sales orders?",
  "Which items are low on stock?",
  "What is my total revenue and outstanding?",
  "How many machines are down?",
  "Production summary",
];

async function answer(question: string): Promise<Answer> {
  const q = question.toLowerCase();

  if (q.includes("low") && q.includes("stock")) {
    const low = await inventoryService.lowStock();
    if (!low.length) return { text: "Good news — no items are below their reorder point right now." };
    return {
      text: `${low.length} item(s) are at or below their reorder point:`,
      table: {
        columns: ["Item", "Warehouse", "On hand", "Reorder"],
        rows: low.map((r) => [r.name, r.warehouseName, r.quantity, r.reorderPoint]),
      },
    };
  }

  if ((q.includes("order") && (q.includes("pending") || q.includes("open"))) || q.includes("pending sales")) {
    const rows = await prisma.salesOrder.findMany({
      where: { deletedAt: null, status: { in: ["CONFIRMED", "IN_PRODUCTION"] } },
      include: { customer: { select: { name: true } } },
      take: 10,
      orderBy: { createdAt: "desc" },
    });
    return {
      text: `You have ${rows.length} open sales order(s) (confirmed or in production).`,
      table: {
        columns: ["Order", "Customer", "Status", "Total"],
        rows: rows.map((r) => [r.number, r.customer.name, r.status, r.total]),
      },
    };
  }

  if (q.includes("revenue") || q.includes("outstanding") || q.includes("payment")) {
    const invoices = await prisma.invoice.findMany({ where: { deletedAt: null } });
    const revenue = invoices.reduce((s, i) => s + i.amountPaid, 0);
    const outstanding = invoices.reduce((s, i) => s + (i.total - i.amountPaid), 0);
    return {
      text: `Collected revenue so far is ₹${revenue.toLocaleString("en-IN")}, with ₹${outstanding.toLocaleString(
        "en-IN",
      )} still outstanding across ${invoices.length} invoice(s).`,
    };
  }

  if (q.includes("machine") && (q.includes("down") || q.includes("maintenance") || q.includes("status"))) {
    const machines = await prisma.machine.findMany({ where: { deletedAt: null } });
    const down = machines.filter((m) => m.status === "DOWN" || m.status === "MAINTENANCE");
    return {
      text: down.length
        ? `${down.length} machine(s) need attention:`
        : "All machines are healthy — none are down or under maintenance.",
      table: down.length
        ? { columns: ["Machine", "Status", "Location"], rows: down.map((m) => [m.name, m.status, m.location ?? "—"]) }
        : undefined,
    };
  }

  if (q.includes("production")) {
    const grouped = await prisma.productionOrder.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: true,
    });
    if (!grouped.length) return { text: "There are no production orders yet." };
    return {
      text: "Here's the production order breakdown by status:",
      table: { columns: ["Status", "Orders"], rows: grouped.map((g) => [g.status, g._count]) },
    };
  }

  return {
    text: "I can answer questions grounded in your live data. Try one of the suggested prompts below.",
  };
}

assistantRouter.get(
  "/suggestions",
  requirePermission("ai:use"),
  asyncHandler(async (_req, res) => ok(res, { suggestions: SUGGESTIONS })),
);

assistantRouter.post(
  "/query",
  requirePermission("ai:use"),
  validate(z.object({ question: z.string().trim().min(1).max(300) })),
  asyncHandler(async (req, res) => ok(res, await answer(req.body.question))),
);
