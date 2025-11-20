import "dotenv/config";

export const jwtConfig = {
  secret: process.env.JWT_SECRET || ("default" as string),
  expiresIn: process.env.JWT_EXPIRES_IN || ("1d," as string | number),
  cookieExpiresIn:
    process.env.JWT_COOKIE_EXPIRES_IN || ((90 * 24 * 60 * 60 * 1000) as number),
};
