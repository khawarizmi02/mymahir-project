import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import prisma from "../PrismaClient.ts";
import { AppError } from "../utils/appError.ts";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        role: "LANDLORD" | "TENANT";
      };
    }
  }
}

export const protectRoute = async (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  try {
    let token = req.cookies?.jwt;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("You are not logged in.", 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      email: string;
      role: "LANDLORD" | "TENANT";
      iat: number;
      exp: number;
    };

    // Optional: Check if user still exists (security)
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return next(new AppError("This account no longer exists.", 401));
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    return next(
      new AppError("Invalid or expired token. Please login again.", 401)
    );
  }
};

/**
 * @param allowedRoles : []"LANDLORD" | "TENANT"
 */
export const restrictTo =
  (...allowedRoles: ("LANDLORD" | "TENANT")[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("You are not authenticated.", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }

    next();
  };

// Combine both: protect + restrict
/**
 *
 * @param roles ("LANDLORD" | "TENANT")[])
 * @example authMiddleware("LANDLORD") or authMiddleware("LANDLORD", "TENANT")
 */
export const authMiddleware = (...roles: ("LANDLORD" | "TENANT")[]) => [
  protectRoute,
  restrictTo(...roles),
];
