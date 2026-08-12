import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

// Structured error response instead of leaking stack traces / raw messages.
// Catches Zod validation errors specially so the client gets field-level detail.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
