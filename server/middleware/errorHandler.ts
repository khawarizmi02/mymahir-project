import type { Request, Response, NextFunction } from "express";
import { logger } from "./loggers";

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Central error-handling middleware.
 * Place it **after** all routes (including the 404 handler).
 */
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Default values
  const statusCode = err.statusCode ?? res.statusCode ?? 500;
  const isProduction = process.env.NODE_ENV === "production";

  // In production hide stack traces from the client
  const payload: any = {
    success: false,
    message: isProduction ? "Internal Server Error" : err.message,
  };

  // Optionally expose validation errors, DB errors, etc.
  if (err.name === "ValidationError") {
    payload.errors = (err as any).errors;
  }

  // Log for developers
  logger.error(
    `[ERROR] ${statusCode} ${err.name}: ${err.message}\n`,
    isProduction ? "" : err.stack
  );

  res.status(statusCode).json(payload);
};
