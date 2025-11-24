# Use the official Bun runtime image
FROM oven/bun:1.1.0-alpine

WORKDIR /app

# Copy package.json and bun.lockb if it exists
COPY package.json bun.lockb* ./

# Install dependencies using Bun
RUN bun install

# Copy the rest of your project
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Expose the API port
EXPOSE 3000

# Add healthcheck (every 30s, timeout 3s)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Run your production start script
CMD ["bun", "run", "start"]
