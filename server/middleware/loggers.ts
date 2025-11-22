import type { Response, Request, NextFunction } from "express";

export const apiLogger = (req: Request, res: Response, next: NextFunction) => {
  const getMYTime = () => {
    return (
      new Date().toLocaleString("en-MY", {
        timeZone: "Asia/Kuala_Lumpur",
        hour12: false,
      }) + " MYT"
    );
  };

  const start = Date.now();

  // Log when request comes in
  console.log(`[${getMYTime()}] → ${req.method} ${req.originalUrl}`);

  // Log when response is sent (optional)
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${getMYTime()}] ← ${req.method} ${req.originalUrl} - ${
        res.statusCode
      } (${duration}ms)`
    );
  });

  next();
};
