import { Router } from "express";
import { prismaRaw } from "../../core/prisma";
import { ok } from "../../core/result";
import { asyncHandler } from "../../middleware/asyncHandler";

export const healthRouter: Router = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    let db = "up";
    try {
      await prismaRaw.$queryRaw`SELECT 1`;
    } catch {
      db = "down";
    }
    return ok(res, {
      status: "ok",
      service: "techforge-api",
      db,
      time: new Date().toISOString(),
    });
  }),
);
