import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import z from "zod";

import type { User } from "../generated/prisma/client.ts";
import type { UserCreateInput } from "../generated/prisma/models.ts";
import prisma from "../PrismaClient.ts";
import { AppError } from "../utils/appError.ts";
import { createUser, updateUserPassword } from "./user.service.ts";
import { sendPinEmail } from "./email.service.ts";
import type { Response } from "express";

export const emailSchema = z.email("Invalid email format");

export const pinRequestSchema = z.object({
  email: z.email("Please provide a valid email address"),
});

export const pinVerifySchema = z.object({
  email: z.email("Please provide a valid email address"),
  pin: z
    .string()
    .length(6, "PIN must be exactly 6 digits")
    .regex(/^\d+$/, "PIN must contain only numbers"),
});

/**
 * @deprecated
 * Use directly inside the controller instead.
 */
const signInService = async (data: User, res: Response): Promise<string> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) throw new AppError("User not found.", 404);
    const token = createTokenService(user.email, res);

    return token;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * @deprecated
 * Use directly inside the controller instead.
 */
const signUpService = async (data: UserCreateInput): Promise<User> => {
  try {
    const newUser = await createUser(data);
    let hasPassword = false;

    if (!newUser) throw new AppError("User creation failed.", 400);

    if (data.hashedPassword)
      hasPassword = await updateUserPassword(newUser, data.hashedPassword);

    return newUser;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
const requestPin = async (user: User): Promise<boolean> => {
  try {
    // Generate 6-digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash PIN
    const pinHash = await bcrypt.hash(pin, 10);

    // Save to DB with 10-minute expiry
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailPinHash: pinHash,
        emailPinExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
      },
    });

    // Send Email
    await sendPinEmail(user, pin);

    return true;
  } catch (error) {
    console.error("PIN request error:", error);
    throw error;
  }
};

const verifyPin = async (
  user: User,
  pin: string,
  res: Response
): Promise<string> => {
  try {
    if (!user || !user.emailPinHash || !user.emailPinExpiry)
      throw new AppError("User validation error.", 400);

    // Check expiry
    if (new Date() > user.emailPinExpiry)
      throw new AppError("Pin expired.", 400);

    // Verify PIN
    const isValid = await bcrypt.compare(
      pin.toString(),
      user.emailPinHash.toString()
    );
    if (!isValid) throw new AppError("Invalid PIN.", 400);

    // Clear PIN after successful use
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailPinHash: null,
        emailPinExpiry: null,
        isEmailVerified: true,
      },
    });

    // Generate JWT
    const token = createTokenService(user.email, res);

    if (!token) throw new AppError("Token error", 400);

    return token;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const createTokenService = (email: string, res: Response): string => {
  const token = jwt.sign({ email }, process.env.JWT_SECRET!, {
    expiresIn: "7d", // 7 days
  });

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  res.cookie("jwt", token, cookieOptions);

  return token;
};

const hashPasswordService = async (pass: string): Promise<string> => {
  try {
    const salt = 10;
    const hashedPassword = await bcrypt.hash(pass, salt);
    return hashedPassword;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const verifyPasswordService = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    const result = await bcrypt.compare(password, hashedPassword);
    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const hashService = {
  hashPasswordService,
  verifyPasswordService,
};

export {
  signInService,
  signUpService,
  requestPin,
  verifyPin,
  hashService,
  createTokenService,
};
