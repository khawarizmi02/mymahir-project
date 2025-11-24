import morgan from "morgan";
import { logger } from "./loggers";

// Custom token for MYT time
morgan.token("myt-date", () => {
  return (
    new Date().toLocaleString("en-MY", {
      timeZone: "Asia/Kuala_Lumpur",
      hour12: false,
    }) + " MYT"
  );
});

// Stream to Winston instead of console.log
const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Skip logging in test
const skip = () => process.env.NODE_ENV === "test";

export const requestLogger = morgan(
  "[:myt-date] :method :url :status :res[content-length] - :response-time ms",
  { stream, skip }
);
