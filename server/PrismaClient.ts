import { PrismaMariaDb } from "@prisma/adapter-mariadb";
// import { PrismaClient } from "@prisma/client";
import { PrismaClient } from "./generated/prisma/client.ts";

const prisma = new PrismaClient();

export default prisma;
