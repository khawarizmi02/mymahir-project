import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import prisma from "./PrismaClient.ts";
import { errorHandler } from "./middleware/errorHandler.ts";

import AuthRoute from "./router/v1/auth.route.ts";
import PropRoute from "./router/v1/property.route.ts";
import PaymentRoute from "./router/v1/payment.route.ts";
import LandlordRoute from "./router/v1/landlord.route.ts";
import InvitationRoute from "./router/v1/invitation.route.ts";
import TenantRoute from "./router/v1/tenant.route.ts";
import { logger } from "./middleware/loggers.ts";
import { requestLogger } from "./middleware/requestLoggers.ts";
import TenancyRoute from "./router/v1/tenancy.route.ts";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "100mb " }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(cors({ credentials: true, origin: "http://localhost:4200" }));

const PORT = process.env.PORT || 3000;

// app.use(apiLogger);
app.use(requestLogger);

app.get("/", (_, res) => {
  res.send("Hello");
});

app.get("/health", async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

app.use(
  "/api/v1/auth",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }),
  AuthRoute
);

app.use(
  "/api/v1/properties",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }),
  PropRoute
);

app.use(
  "/api/v1/landlord",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }),
  LandlordRoute
);

app.use(
  "/api/v1/invitations",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }),
  InvitationRoute
);

app.use(
  "/api/v1/tenant",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }),
  TenantRoute
);

app.use(
  "/api/v1/tenancies",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }),
  TenancyRoute
);

app.use(
  "/api/v1/payments",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }),
  PaymentRoute
);
// app.use(
//   "/api/v1/payments",
//   rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }),
//   PaymentRoute
// );

app.use(errorHandler);

// === HEALTHY STARTUP: Only start server after DB is connected ===
async function connectToDatabase(retries = 5, delay = 5000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      logger.info(
        `Attempting to connect to database... (attempt ${i + 1}/${retries})`
      );
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;

      logger.info("Successfully connected to MariaDB!");

      if (process.env.NODE_ENV !== "production") {
        await prisma.$executeRaw`SELECT 1`; // or use migrate deploy
      }

      return;
    } catch (error: any) {
      logger.error("Database connection failed:", error.message);

      if (i === retries - 1) {
        logger.error("Max retries reached. Exiting...");
        process.exit(1);
      }

      logger.info(`Retrying in ${delay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received: Closing Prisma connection...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received: Closing Prisma connection...");
  await prisma.$disconnect();
  process.exit(0);
});

// === Start the server only after DB is ready ===
async function startServer() {
  try {
    await connectToDatabase();

    app.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (err) {
    logger.error("Failed to start server due to database connection issues.");
    process.exit(1);
  }
}

startServer();
