# Base bun image
FROM oven/bun:canary-alpine AS base
WORKDIR /usr/src/app

# --------------------------
# 1. Install dependencies
# --------------------------
FROM base AS install

RUN mkdir -p /temp/dev
COPY package.json bun.lockb* bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lockb* bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# --------------------------
# 2. Copy source code
# --------------------------
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules ./node_modules
COPY . .

# # Generate Prisma client
# RUN bunx prisma generate

# --------------------------
# 3. Final Release image
# --------------------------
FROM base AS release

# Copy only production node_modules
COPY --from=install /temp/prod/node_modules ./node_modules

# Copy source code (everything)
COPY --from=prerelease /usr/src/app ./

# Install curl for healthcheck
RUN apk add --no-cache curl

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# # Run in production mode
# ENTRYPOINT ["bun", "run", "start"]

# Generate Prisma client at runtime (when env vars exist) + start server
ENTRYPOINT ["sh", "-c", "bunx prisma generate && bun run start"]