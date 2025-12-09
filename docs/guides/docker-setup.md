# Docker Setup Guide

This guide explains how to set up and use Docker for local development and testing with Twiggle.

## Overview

Docker is used for:
- **Development**: Local PostgreSQL database + Next.js dev server
- **Testing**: Separate PostgreSQL database for automated tests
- **Production**: Uses hosted PostgreSQL (Vercel Postgres, Neon, Supabase, or Cloud SQL) - Docker is NOT used in production

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2 (included with Docker Desktop)

## Initial Setup

### 1. Create Environment Files

Create the following environment files in the project root:

#### `.env.development`
```env
# Development Environment Variables
# This file is used when running with Docker Compose

# Database - Docker PostgreSQL
DATABASE_URL="postgresql://postgres:password@db:5432/twiggle_dev?sslmode=disable"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"

# Google OAuth (add your credentials)
# GOOGLE_CLIENT_ID="your-client-id"
# GOOGLE_CLIENT_SECRET="your-client-secret"

# Google Cloud Storage (add your credentials)
# GCS_PROJECT_ID="your-project-id"
# GCS_BUCKET_NAME="your-bucket-name"
# GCS_KEY_FILENAME="key/twiggle-479508-b9ea5eaacf83.json"
```

#### `.env.test`
```env
# Test Environment Variables
# This file is used when running automated tests

# Database - Docker PostgreSQL (test database)
DATABASE_URL="postgresql://postgres:password@localhost:5433/twiggle_test?sslmode=disable"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-secret-key"

# Google OAuth (test credentials if needed)
# GOOGLE_CLIENT_ID="test-client-id"
# GOOGLE_CLIENT_SECRET="test-client-secret"

# Google Cloud Storage (test credentials if needed)
# GCS_PROJECT_ID="test-project-id"
# GCS_BUCKET_NAME="test-bucket-name"
```

#### `.env.production.example`
```env
# Production Environment Variables
# Copy this to .env.production and fill in your production values
# DO NOT use Docker PostgreSQL in production - use a hosted provider

# Database - Hosted PostgreSQL (Vercel Postgres, Neon, Supabase, or Cloud SQL)
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# NextAuth Configuration
NEXTAUTH_URL="https://your-production-domain.com"
NEXTAUTH_SECRET="your-production-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-production-client-id"
GOOGLE_CLIENT_SECRET="your-production-client-secret"

# Google Cloud Storage
GCS_PROJECT_ID="your-production-project-id"
GCS_BUCKET_NAME="your-production-bucket-name"
GCS_KEY_FILENAME="key/your-production-key.json"
```

### 2. Start Docker Services

Start the development database:

```bash
docker compose up -d
```

This will start:
- PostgreSQL database on port `5432` (development)
- PostgreSQL test database on port `5433` (for testing)

### 3. Initialize Database Schema

Run Prisma migrations to set up the database schema:

**Important:** When running commands from your local machine (not inside Docker), use `npx dotenv-cli` or the npm scripts:

```bash
# Option A: Using npm script (recommended)
npm run db:migrate:dev

# Option B: Using npx directly
npx dotenv-cli -e .env.development -- prisma migrate dev
```

Or push the schema directly (for development):

```bash
# Option A: Using npm script (recommended)
npm run db:push:dev

# Option B: Using npx directly
npx dotenv-cli -e .env.development -- prisma db push
```

**Note:** The `.env.development` file uses `localhost:5432` (not `db:5432`) because you're running commands from your local machine. The `db` hostname only works inside the Docker network.

## Development Workflow

### Option 1: Run Next.js Locally (Recommended for Development)

1. Start Docker services (database only):
   ```bash
   docker compose up db -d
   ```

2. Run Next.js locally (for better hot reload):
   ```bash
   npm run dev
   ```

   The app will connect to the Docker PostgreSQL database.

### Option 2: Run Everything in Docker

1. Start all services:
   ```bash
   docker compose up
   ```

2. Access the app at `http://localhost:3000`

   Note: Hot reload works, but may be slightly slower than running locally.

### Useful Commands

```bash
# Start services in background
npm run docker:up
# or
docker compose up -d

# Stop services
npm run docker:down
# or
docker compose down

# View logs
npm run docker:logs
# or
docker compose logs -f

# Database operations (Docker)
npm run db:migrate:dev      # Create migration
npm run db:push:dev         # Quick push (no migrations)
npm run db:studio:dev       # Open Prisma Studio
npm run db:dev:reset        # Reset development database

# Database operations (Vercel Postgres - uses .env.local)
npm run db:migrate          # Create migration
npm run db:push             # Quick push
npm run db:studio           # Open Prisma Studio
```

## Testing Workflow

1. Start the test database:
   ```bash
   docker compose up test-db -d
   ```

2. Run your tests:
   ```bash
   npm run test
   # or your test command
   ```

3. Reset test database if needed:
   ```bash
   npm run db:test:reset
   ```

## Production

**Important**: Production does NOT use Docker PostgreSQL. 

- Use a hosted PostgreSQL provider (Vercel Postgres, Neon, Supabase, or Cloud SQL)
- Set `DATABASE_URL` in your production environment variables
- The Dockerfile can be used to build production images, but the database connection will use the hosted provider

### Building Production Image

```bash
docker build -t twiggle-frontend:latest .
```

### Running Production Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="your-production-database-url" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e NEXTAUTH_SECRET="your-secret" \
  twiggle-frontend:latest
```

## Troubleshooting

### "dotenv is not recognized"

**Problem:** The `dotenv` command isn't found when running directly.

**Solution:** Use `npx dotenv-cli` or the npm scripts:
```bash
# ❌ Wrong
dotenv -e .env.development -- prisma migrate dev

# ✅ Correct
npx dotenv-cli -e .env.development -- prisma migrate dev

# ✅ Even better - use npm scripts
npm run db:migrate:dev
```

### "Can't reach database server at `db:5432`"

**Problem:** When running from your local machine, the hostname `db` doesn't resolve.

**Solution:** 
1. Make sure Docker is running: `docker compose up db -d`
2. Verify `.env.development` uses `localhost:5432` (not `db:5432`) when running commands locally
3. The `db` hostname only works inside Docker containers

### Database Connection Issues

- Ensure Docker containers are running: `docker compose ps`
- Check database logs: `docker compose logs db`
- Verify DATABASE_URL in `.env.development` uses `localhost:5432` for local commands

### Port Conflicts

- If port 5432 is already in use, change it in `docker-compose.yml`
- If port 3000 is in use, change it in `docker-compose.yml`

### Reset Everything

```bash
# Stop and remove containers and volumes
docker compose down -v

# Start fresh
docker compose up -d
```

### Prisma Client Issues

If you get Prisma Client errors:

```bash
# Regenerate Prisma Client
npx prisma generate
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Development Environment         │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Next.js    │───▶│  PostgreSQL  │  │
│  │  (Port 3000) │    │  (Port 5432) │  │
│  └──────────────┘    └──────────────┘  │
│                                         │
│  ┌──────────────┐                       │
│  │  Test DB     │                       │
│  │  (Port 5433) │                       │
│  └──────────────┘                       │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Production Environment          │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Next.js    │───▶│  Hosted DB   │  │
│  │  (Vercel)    │    │ (Vercel/Neon)│  │
│  └──────────────┘    └──────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## Next Steps

- See [Database Setup Guide](./database-setup.md) for more database configuration
- See [Google Auth Setup](./google-auth.md) for authentication configuration
- See [Google Cloud Storage Setup](./google-cloud-storage.md) for file storage setup

