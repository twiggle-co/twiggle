# Multi-stage Dockerfile for Next.js + Prisma

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies (ignore engine check for Docker - Node 20 works fine)
RUN npm ci --ignore-engines

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build Next.js application (only in production mode)
ARG NODE_ENV=production
RUN if [ "$NODE_ENV" = "production" ]; then npm run build; else echo "Skipping build in development mode"; fi

# Stage 2: Runner (for production)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install production dependencies only (ignore engine check for Docker)
RUN npm ci --only=production --ignore-engines && npm cache clean --force

# Copy Prisma files and generate client
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

# Stage 3: Development (used by docker-compose)
FROM node:20-alpine AS dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma files BEFORE npm ci (needed for postinstall script)
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install all dependencies (including dev)
# Skip postinstall during npm ci, we'll run it manually after
# Ignore engine check for Docker (Node 20 works fine, package.json requires 24+)
RUN npm ci --ignore-scripts --ignore-engines

# Generate Prisma Client (manually run postinstall)
RUN npx prisma generate && npx patch-package

# Copy everything else (source code will be mounted as volume)
COPY . .

# Expose port
EXPOSE 3000

# Default command (will be overridden by docker-compose)
CMD ["npm", "run", "dev"]

