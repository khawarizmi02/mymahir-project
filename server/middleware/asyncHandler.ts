import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async route handler so that any thrown/rejected error
 * is automatically forwarded to Express' error-handling middleware.
 */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
