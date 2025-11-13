import { PrismaMariaDb } from "@prisma/adapter-mariadb";
// import { PrismaClient } from "@prisma/client";
import { PrismaClient } from "./generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: "127.0.0.1",
  port: 3306,
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });
