import type { NextFunction, Request, Response } from "express";
import { AppError } from "../core/errors";
import { logger } from "../core/logger";
import { getContext } from "../core/context";

/** Terminal error handler — converts any thrown error into the standard error envelope. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const requestId = getContext()?.requestId;

  if (err instanceof AppError) {
    if (err.status >= 500) logger.error({ err, requestId }, err.message);
    return res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  logger.error({ err, requestId }, "Unhandled error");
  return res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
}

/** 404 for unmatched routes. */
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
}
