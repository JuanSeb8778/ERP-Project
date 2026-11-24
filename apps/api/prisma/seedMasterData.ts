import type { PrismaClient } from "@prisma/client";

/**
 * Phase 2 demo data for TechForge (an electric-motor & pump manufacturer):
 * customers, suppliers, products, raw materials, warehouses, BOMs and opening
 * stock. Idempotent — safe to run on every seed.
 */
export async function seedMasterData(prisma: PrismaClient, companyId: string) {
  // ── Customers ──
  const customers = [
    { code: "CUST-001", name: "Apex Industrial Supplies", contactPerson: "Ramesh Iyer", email: "ramesh@apexind.example", phone: "+91 98200 11111", city: "Mumbai", state: "MH", gstin: "27AAAAA0000A1Z5", creditLimit: 500000 },
    { code: "CUST-002", name: "Bharat Pumps & Motors", contactPerson: "Sunita Rao", email: "sunita@bharatpm.example", phone: "+91 98200 22222", city: "Pune", state: "MH", gstin: "27BBBBB0000B1Z5", creditLimit: 750000 },
    { code: "CUST-003", name: "Coastal Water Works", contactPerson: "John Mathew", email: "john@coastalww.example", phone: "+91 98200 33333", city: "Kochi", state: "KL", gstin: "32CCCCC0000C1Z5", creditLimit: 300000 },
    { code: "CUST-004", name: "Deccan Agro Equipments", contactPerson: "Farhan Ali", email: "farhan@deccanagro.example", phone: "+91 98200 44444", city: "Hyderabad", state: "TG", gstin: "36DDDDD0000D1Z5", creditLimit: 450000 },
    { code: "CUST-005", name: "Everest Engineering Co.", contactPerson: "Priya Menon", email: "priya@everesteng.example", phone: "+91 98200 55555", city: "Ahmedabad", state: "GJ", gstin: "24EEEEE0000E1Z5", creditLimit: 600000 },
  ];
  for (const c of customers) {
    await prisma.customer.upsert({
      where: { companyId_code: { companyId, code: c.code } },
      update: c,
      create: { companyId, ...c },
    });
  }

  // ── Suppliers ──
  const suppliers = [
    { code: "SUP-001", name: "Metro Copper & Alloys", contactPerson: "Anil Gupta", email: "anil@metrocopper.example", phone: "+91 90000 11111", city: "Delhi", state: "DL", leadTimeDays: 5, rating: 4 },
    { code: "SUP-002", name: "Precision Bearings Ltd.", contactPerson: "Kavita Shah", email: "kavita@precisionbrg.example", phone: "+91 90000 22222", city: "Rajkot", state: "GJ", leadTimeDays: 7, rating: 5 },
    { code: "SUP-003", name: "Shakti Steel Traders", contactPerson: "Manish Verma", email: "manish@shaktisteel.example", phone: "+91 90000 33333", city: "Nagpur", state: "MH", leadTimeDays: 10, rating: 3 },
    { code: "SUP-004", name: "Castwell Foundry", contactPerson: "Reena Nair", email: "reena@castwell.example", phone: "+91 90000 44444", city: "Coimbatore", state: "TN", leadTimeDays: 12, rating: 4 },
  ];
  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { companyId_code: { companyId, code: s.code } },
      update: s,
      create: { companyId, ...s },
    });
  }

  // ── Products (finished goods) ──
  const products = [
    { sku: "FG-MTR-1HP", name: "1 HP Single-Phase Induction Motor", category: "Motors", unit: "pcs", unitPrice: 4500, reorderPoint: 20 },
    { sku: "FG-MTR-2HP", name: "2 HP Three-Phase Induction Motor", category: "Motors", unit: "pcs", unitPrice: 7200, reorderPoint: 15 },
    { sku: "FG-PMP-CF1", name: "Centrifugal Pump CF-1", category: "Pumps", unit: "pcs", unitPrice: 6800, reorderPoint: 10 },
    { sku: "FG-PMP-SUB2", name: "Submersible Pump SUB-2", category: "Pumps", unit: "pcs", unitPrice: 9500, reorderPoint: 8 },
    { sku: "FG-GEN-3K", name: "3 kVA Portable Generator", category: "Generators", unit: "pcs", unitPrice: 18500, reorderPoint: 5 },
  ];
  const productBySku = new Map<string, string>();
  for (const p of products) {
    const row = await prisma.product.upsert({
      where: { companyId_sku: { companyId, sku: p.sku } },
      update: p,
      create: { companyId, ...p },
    });
    productBySku.set(p.sku, row.id);
  }

  // ── Raw materials ──
  const rawMaterials = [
    { code: "RM-CU-WIRE", name: "Copper Winding Wire", category: "Metals", unit: "kg", unitCost: 780, reorderPoint: 100 },
    { code: "RM-STEEL-SHAFT", name: "Steel Shaft 20mm", category: "Metals", unit: "pcs", unitCost: 220, reorderPoint: 50 },
    { code: "RM-BEARING-608", name: "Ball Bearing 608ZZ", category: "Bearings", unit: "pcs", unitCost: 45, reorderPoint: 200 },
    { code: "RM-HOUSING-AL", name: "Aluminium Housing Casting", category: "Castings", unit: "pcs", unitCost: 340, reorderPoint: 40 },
    { code: "RM-STATOR-LAM", name: "Stator Lamination Set", category: "Electricals", unit: "set", unitCost: 510, reorderPoint: 30 },
    { code: "RM-IMPELLER", name: "Brass Impeller", category: "Castings", unit: "pcs", unitCost: 290, reorderPoint: 25 },
    { code: "RM-FASTENER", name: "Fastener Kit", category: "Hardware", unit: "set", unitCost: 35, reorderPoint: 300 },
    { code: "RM-PAINT", name: "Enamel Paint", category: "Consumables", unit: "ltr", unitCost: 160, reorderPoint: 20 },
  ];
  const rmByCode = new Map<string, string>();
  for (const m of rawMaterials) {
    const row = await prisma.rawMaterial.upsert({
      where: { companyId_code: { companyId, code: m.code } },
      update: m,
      create: { companyId, ...m },
    });
    rmByCode.set(m.code, row.id);
  }

  // ── Warehouses ──
  const warehouses = [
    { code: "WH-MAIN", name: "Main Raw-Material Store", location: "Plant 1 · Block A", isDefault: true },
    { code: "WH-FG", name: "Finished Goods Store", location: "Plant 1 · Block C" },
    { code: "WH-WIP", name: "Shop-Floor WIP", location: "Plant 1 · Shop Floor" },
  ];
  const whByCode = new Map<string, string>();
  for (const w of warehouses) {
    const row = await prisma.warehouse.upsert({
      where: { companyId_code: { companyId, code: w.code } },
      update: w,
      create: { companyId, ...w },
    });
    whByCode.set(w.code, row.id);
  }

  // ── Bills of Materials (rebuilt each seed for idempotency) ──
  const boms: { sku: string; name: string; components: { code: string; quantity: number; scrapPct: number }[] }[] = [
    {
      sku: "FG-MTR-1HP",
      name: "1 HP Motor — Standard BOM",
      components: [
        { code: "RM-CU-WIRE", quantity: 2.5, scrapPct: 3 },
        { code: "RM-STEEL-SHAFT", quantity: 1, scrapPct: 0 },
        { code: "RM-BEARING-608", quantity: 2, scrapPct: 1 },
        { code: "RM-HOUSING-AL", quantity: 1, scrapPct: 2 },
        { code: "RM-STATOR-LAM", quantity: 1, scrapPct: 1 },
        { code: "RM-FASTENER", quantity: 1, scrapPct: 0 },
        { code: "RM-PAINT", quantity: 0.2, scrapPct: 5 },
      ],
    },
    {
      sku: "FG-PMP-CF1",
      name: "Centrifugal Pump CF-1 — Standard BOM",
      components: [
        { code: "RM-HOUSING-AL", quantity: 1, scrapPct: 2 },
        { code: "RM-IMPELLER", quantity: 1, scrapPct: 1 },
        { code: "RM-STEEL-SHAFT", quantity: 1, scrapPct: 0 },
        { code: "RM-BEARING-608", quantity: 2, scrapPct: 1 },
        { code: "RM-FASTENER", quantity: 1, scrapPct: 0 },
        { code: "RM-PAINT", quantity: 0.15, scrapPct: 5 },
      ],
    },
  ];
  for (const b of boms) {
    const productId = productBySku.get(b.sku)!;
    await prisma.bom.deleteMany({ where: { companyId, productId } });
    await prisma.bom.create({
      data: {
        companyId,
        productId,
        name: b.name,
        version: "v1",
        isActive: true,
        components: {
          create: b.components.map((c) => ({
            rawMaterialId: rmByCode.get(c.code)!,
            quantity: c.quantity,
            scrapPct: c.scrapPct,
          })),
        },
      },
    });
  }

  // ── Opening stock (only when a level doesn't exist yet — preserves the ledger) ──
  const opening: { wh: string; type: "PRODUCT" | "RAW_MATERIAL"; item: string; qty: number }[] = [
    // Raw materials in the main store — a couple intentionally below reorder point.
    { wh: "WH-MAIN", type: "RAW_MATERIAL", item: "RM-CU-WIRE", qty: 60 }, // low (reorder 100)
    { wh: "WH-MAIN", type: "RAW_MATERIAL", item: "RM-STEEL-SHAFT", qty: 140 },
    { wh: "WH-MAIN", type: "RAW_MATERIAL", item: "RM-BEARING-608", qty: 520 },
    { wh: "WH-MAIN", type: "RAW_MATERIAL", item: "RM-HOUSING-AL", qty: 35 }, // low (reorder 40)
    { wh: "WH-MAIN", type: "RAW_MATERIAL", item: "RM-STATOR-LAM", qty: 90 },
    { wh: "WH-MAIN", type: "RAW_MATERIAL", item: "RM-IMPELLER", qty: 70 },
    { wh: "WH-MAIN", type: "RAW_MATERIAL", item: "RM-FASTENER", qty: 900 },
    { wh: "WH-MAIN", type: "RAW_MATERIAL", item: "RM-PAINT", qty: 12 }, // low (reorder 20)
    // Finished goods
    { wh: "WH-FG", type: "PRODUCT", item: "FG-MTR-1HP", qty: 34 },
    { wh: "WH-FG", type: "PRODUCT", item: "FG-MTR-2HP", qty: 9 }, // low (reorder 15)
    { wh: "WH-FG", type: "PRODUCT", item: "FG-PMP-CF1", qty: 18 },
    { wh: "WH-FG", type: "PRODUCT", item: "FG-PMP-SUB2", qty: 4 }, // low (reorder 8)
    { wh: "WH-FG", type: "PRODUCT", item: "FG-GEN-3K", qty: 7 },
  ];
  for (const o of opening) {
    const warehouseId = whByCode.get(o.wh)!;
    const itemId = o.type === "PRODUCT" ? productBySku.get(o.item)! : rmByCode.get(o.item)!;
    const exists = await prisma.stock.findFirst({
      where: { warehouseId, itemType: o.type, itemId },
    });
    if (exists) continue;
    await prisma.stock.create({
      data: { companyId, warehouseId, itemType: o.type, itemId, quantity: o.qty },
    });
    await prisma.stockMovement.create({
      data: {
        companyId,
        warehouseId,
        itemType: o.type,
        itemId,
        delta: o.qty,
        balanceAfter: o.qty,
        reason: "OPENING",
        note: "Opening balance (seed)",
      },
    });
  }

  // ── Transactional demo data (Phase 3–6) ──
  const custRows = await prisma.customer.findMany({ where: { companyId } });
  const supRows = await prisma.supplier.findMany({ where: { companyId } });
  const custId = (code: string) => custRows.find((c) => c.code === code)!.id;
  const supId = (code: string) => supRows.find((s) => s.code === code)!.id;

  const upsertNum = async (
    model: "inquiry" | "quotation" | "salesOrder" | "purchaseOrder" | "invoice" | "payment" | "inspection" | "productionOrder" | "machine" | "employee",
    where: object,
    data: object,
  ) => {
    // @ts-expect-error dynamic delegate access is fine for seeding
    await prisma[model].upsert({ where, update: data, create: data });
  };

  const machines = [
    { code: "MC-CNC-01", name: "CNC Lathe 01", type: "CNC", status: "RUNNING", location: "Shop Floor A" },
    { code: "MC-WIND-01", name: "Coil Winding 01", type: "Winding", status: "RUNNING", location: "Shop Floor A" },
    { code: "MC-PRESS-01", name: "Hydraulic Press 01", type: "Press", status: "DOWN", location: "Shop Floor B" },
    { code: "MC-PAINT-01", name: "Paint Booth 01", type: "Finishing", status: "MAINTENANCE", location: "Shop Floor C" },
  ];
  for (const m of machines)
    await upsertNum("machine", { companyId_code: { companyId, code: m.code } }, { companyId, ...m });

  const employees = [
    { code: "EMP-001", firstName: "Suresh", lastName: "Patil", department: "Production", designation: "Shop Supervisor", status: "ACTIVE" },
    { code: "EMP-002", firstName: "Lakshmi", lastName: "Menon", department: "Quality", designation: "QC Inspector", status: "ACTIVE" },
    { code: "EMP-003", firstName: "Imran", lastName: "Sheikh", department: "Production", designation: "Machine Operator", status: "ON_LEAVE" },
    { code: "EMP-004", firstName: "Deepa", lastName: "Krishnan", department: "Stores", designation: "Store Keeper", status: "ACTIVE" },
  ];
  for (const e of employees)
    await upsertNum("employee", { companyId_code: { companyId, code: e.code } }, { companyId, ...e });

  const inquiries = [
    { number: "INQ-001", customerId: custId("CUST-001"), subject: "50× 1 HP motors for pump assembly", status: "QUOTED" },
    { number: "INQ-002", customerId: custId("CUST-003"), subject: "Submersible pumps annual contract", status: "OPEN" },
  ];
  for (const i of inquiries)
    await upsertNum("inquiry", { companyId_number: { companyId, number: i.number } }, { companyId, ...i });

  const quotations = [
    { number: "QT-001", customerId: custId("CUST-001"), status: "SENT", subtotal: 225000, taxPct: 18, total: 265500 },
    { number: "QT-002", customerId: custId("CUST-002"), status: "ACCEPTED", subtotal: 190000, taxPct: 18, total: 224200 },
  ];
  for (const q of quotations)
    await upsertNum("quotation", { companyId_number: { companyId, number: q.number } }, { companyId, ...q });

  const orders = [
    { number: "SO-001", customerId: custId("CUST-002"), status: "IN_PRODUCTION", total: 224200 },
    { number: "SO-002", customerId: custId("CUST-004"), status: "CONFIRMED", total: 148000 },
    { number: "SO-003", customerId: custId("CUST-005"), status: "DISPATCHED", total: 96000 },
  ];
  for (const o of orders)
    await upsertNum("salesOrder", { companyId_number: { companyId, number: o.number } }, { companyId, ...o });

  const pos = [
    { number: "PO-001", supplierId: supId("SUP-001"), status: "SENT", total: 78000 },
    { number: "PO-002", supplierId: supId("SUP-002"), status: "RECEIVED", total: 22500 },
  ];
  for (const p of pos)
    await upsertNum("purchaseOrder", { companyId_number: { companyId, number: p.number } }, { companyId, ...p });

  const invoices = [
    { number: "INV-001", customerId: custId("CUST-005"), status: "PAID", total: 96000, amountPaid: 96000 },
    { number: "INV-002", customerId: custId("CUST-002"), status: "PARTIAL", total: 224200, amountPaid: 100000 },
  ];
  for (const inv of invoices)
    await upsertNum("invoice", { companyId_number: { companyId, number: inv.number } }, { companyId, ...inv });

  const payments = [
    { number: "PAY-001", customerId: custId("CUST-005"), amount: 96000, method: "BANK", reference: "UTR12345" },
    { number: "PAY-002", customerId: custId("CUST-002"), amount: 100000, method: "UPI", reference: "UPI98765" },
  ];
  for (const p of payments)
    await upsertNum("payment", { companyId_number: { companyId, number: p.number } }, { companyId, ...p });

  const inspections = [
    { number: "QC-001", type: "INCOMING", status: "PASSED", reference: "PO-002" },
    { number: "QC-002", type: "FINAL", status: "PENDING", reference: "SO-001" },
  ];
  for (const q of inspections)
    await upsertNum("inspection", { companyId_number: { companyId, number: q.number } }, { companyId, ...q });

  const prodOrders = [
    { number: "PRD-001", productId: productBySku.get("FG-MTR-2HP")!, quantity: 25, status: "IN_PROGRESS" },
    { number: "PRD-002", productId: productBySku.get("FG-PMP-CF1")!, quantity: 15, status: "PLANNED" },
  ];
  for (const p of prodOrders)
    await upsertNum("productionOrder", { companyId_number: { companyId, number: p.number } }, { companyId, ...p });

  return {
    customers: customers.length,
    suppliers: suppliers.length,
    products: products.length,
    rawMaterials: rawMaterials.length,
    warehouses: warehouses.length,
    boms: boms.length,
  };
}
