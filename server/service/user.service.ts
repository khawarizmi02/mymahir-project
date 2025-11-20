import z from "zod";

import type { User } from "../generated/prisma/client";
import type { UserCreateInput } from "../generated/prisma/models";
import prisma from "../PrismaClient.ts";
import { AppError } from "../utils/appError.ts";
import { emailSchema, hashService } from "./auth.service.ts";

const findUserByEmail = async (emailInput: string): Promise<User | null> => {
  try {
    const email = emailSchema.parse(emailInput);
    const user = await prisma.user.findUnique({ where: { email } });

    return user;
  } catch (error) {
    throw error;
  }
};

const createUser = async (NewUser: UserCreateInput): Promise<User> => {
  try {
    // const newUser = await prisma.user.create({
    //   data: NewUser,
    // });

    const newUser = await prisma.user.upsert({
      create: NewUser,
      update: NewUser,
      where: { email: NewUser.email },
    });

    if (!newUser) throw new AppError("User creation fails.");

    return newUser;
  } catch (error) {
    throw error;
  }
};

const updateUserPassword = async (
  user: User,
  pass: string
): Promise<boolean> => {
  try {
    const hashedPassword = await hashService.hashPasswordService(pass);
    const success = await prisma.user.update({
      where: { email: user.email },
      data: {
        hashedPassword,
      },
    });

    if (!success) throw new AppError("Password error.");
    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export { findUserByEmail, createUser, updateUserPassword };
