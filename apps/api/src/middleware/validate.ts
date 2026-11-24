import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { Errors } from "../core/errors";

type Source = "body" | "query" | "params";

/** Validate and coerce a request part with a Zod schema; replaces it with the parsed value. */
export function validate(schema: ZodSchema, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(Errors.validation(result.error.flatten().fieldErrors));
    }
    // query/params are read-only getters on newer express; assign defensively.
    if (source === "body") req.body = result.data;
    else Object.defineProperty(req, source, { value: result.data, configurable: true });
    next();
  };
}
