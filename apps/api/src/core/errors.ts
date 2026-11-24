/** Application error with an HTTP status and a stable machine code. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  unauthorized: (msg = "Authentication required") => new AppError(401, "UNAUTHORIZED", msg),
  forbidden: (msg = "You do not have permission to perform this action") =>
    new AppError(403, "FORBIDDEN", msg),
  notFound: (msg = "Resource not found") => new AppError(404, "NOT_FOUND", msg),
  conflict: (msg = "Conflict") => new AppError(409, "CONFLICT", msg),
  validation: (details: unknown, msg = "Validation failed") =>
    new AppError(422, "VALIDATION_ERROR", msg, details),
  badRequest: (msg = "Bad request") => new AppError(400, "BAD_REQUEST", msg),
  tooMany: (msg = "Too many requests") => new AppError(429, "RATE_LIMITED", msg),
};
