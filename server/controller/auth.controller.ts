import type { Request, Response } from "express";
import {
  createTokenService,
  hashService,
  requestPin,
  verifyPin,
} from "../service/auth.service.ts";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import {
  createUser,
  findUserByEmail,
  updateUserPassword,
} from "../service/user.service.ts";
import { AppError } from "../utils/appError.ts";

/**
 * @deprecated
 * Please use {@link requestPin} to create new user.
 * Then, to login use {@link verifyPin} to login.
 */
const signIn = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  let isAuth = false;

  if (!password) throw new AppError("Password is required.");

  if (!user) throw new AppError("User not found.", 404);

  if (password && user.hashedPassword)
    isAuth = await hashService.verifyPasswordService(
      password,
      user.hashedPassword
    );

  if (!isAuth) throw new AppError("User not authenticated.", 400);

  const token = createTokenService(user.id, user.email, user.role, res);

  res.json({ success: true, message: "sign-in", data: token });
});

/**
 * @deprecated
 * Please use {@link requestPin} to create new user.
 * Then, to login use {@link verifyPin} to login.
 */
const signUp = asyncHandler(async (req: Request, res: Response) => {
  const { email, role, name, password } = req.body;

  if (!password) throw new AppError("Password is required.");

  const userData = {
    email,
    role,
    name,
  };
  const newUser = await createUser(userData);

  if (!newUser) throw new AppError("User creation failed.", 400);

  await updateUserPassword(newUser, password);

  res.json({ success: true, message: "sign-up", data: newUser });
});

const PinRequest = asyncHandler(async (req: Request, res: Response) => {
  const { email, role, name, password } = req.query as {
    email?: string;
    role?: "LANDLORD" | "TENANT";
    name?: string;
    password?: string;
  };

  console.log(email);

  if (!email || !role) {
    return res.status(401).json({
      success: false,
      message: "Email and role are required",
    });
  }

  let user = await findUserByEmail(email);

  // For TENANT role, verify password if user exists and has a password
  if (role === "TENANT" && user) {
    // If tenant has a password (registered via invitation), verify it
    if (user.hashedPassword) {
      if (!password) {
        return res.status(401).json({
          success: false,
          message: "Password is required for tenant login",
        });
      }

      const isPasswordValid = await hashService.verifyPasswordService(
        password,
        user.hashedPassword
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid password",
        });
      }
    }
  }

  // create new user if not exists
  if (!user) {
    // For tenants, they should register via invitation first
    if (role === "TENANT") {
      return res.status(401).json({
        success: false,
        message: "Tenant account not found. Please register via landlord invitation.",
      });
    }

    user = await createUser({
      email,
      role,
      name: name || null,
      isEmailVerified: false,
    });
  }

  const success = await requestPin(user);
  res.json({ success, message: "pin-request" });
});

const PinVerify = asyncHandler(async (req: Request, res: Response) => {
  const { email, pin } = req.body;

  if (!email || !pin)
    res.status(400).json({ success: false, message: "Invalid email or pin" });

  const user = await findUserByEmail(email);

  if (!user || !user.emailPinHash || !user.emailPinExpiry) {
    return res.status(401).json({ success: false, message: "Invalid request" });
  }

  const token = await verifyPin(user, pin, res);

  res.json({
    success: true,
    message: "Token generated",
    data: { token, role: user.role },
  });
});

export { signIn, signUp, PinRequest, PinVerify };
