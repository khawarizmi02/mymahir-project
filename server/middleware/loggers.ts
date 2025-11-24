// server/src/lib/logger.ts
import winston from "winston";

const alignColorsAndTime = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({
    format: () => {
      return (
        new Date().toLocaleString("en-MY", {
          timeZone: "Asia/Kuala_Lumpur",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }) + " MYT"
      );
    },
  }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.stack || info.message}`
  )
);

const jsonWithMytTime = winston.format.combine(
  winston.format.timestamp({
    format: () => {
      return (
        new Date().toLocaleString("en-MY", {
          timeZone: "Asia/Kuala_Lumpur",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }) + " MYT"
      );
    },
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format:
    process.env.NODE_ENV === "production"
      ? jsonWithMytTime
      : alignColorsAndTime,
  transports: [
    new winston.transports.Console(),
    // Optional file logs later
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
  exceptionHandlers: [new winston.transports.Console()],
  rejectionHandlers: [new winston.transports.Console()],
});
