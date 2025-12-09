# Database Setup

This guide covers setting up a PostgreSQL database for Twiggle. You can use either:

- **Docker** (recommended for local development) - See [Docker Setup Guide](./docker-setup.md) for complete Docker setup
- **Vercel Postgres** (for production or cloud-hosted development) - This guide focuses on Vercel Postgres setup

> **💡 Tip:** If you're setting up for the first time and want the easiest local development experience, start with the [Docker Setup Guide](./docker-setup.md) which includes database setup.

## Prerequisites

- Node.js 24+ (required for Prisma 7)
- npm or compatible package manager
- **OR** Docker Desktop (if using Docker - see [Docker Setup Guide](./docker-setup.md))

## Step 1: Create Database

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → Your Project
2. Click **Storage** tab → **Create Database** → **Postgres**
3. Name it and select region
4. Copy the connection string

## Step 2: Environment Variables

### Option A: Using Docker (Recommended for Local Development)

If you're using Docker, create `.env.development` (see [Docker Setup Guide](./docker-setup.md) for details):

```env
DATABASE_URL="postgresql://postgres:password@db:5432/twiggle_dev?sslmode=disable"
```

### Option B: Using Vercel Postgres or Other Hosted Provider

Create `.env.local` in project root:

```env
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

## Step 3: Install Dependencies

```bash
npm install
```

This will automatically run `prisma generate` after installation (via postinstall script).

## Step 4: Initialize Database

### If Using Docker

```bash
# Start Docker database
docker compose up db -d

# Initialize database schema
# Option A: Using npm script (recommended)
npm run db:migrate:dev
# OR for quick development (no migration files):
npm run db:push:dev

# Option B: Using npx directly
npx dotenv-cli -e .env.development -- prisma migrate dev
# OR for quick development:
npx dotenv-cli -e .env.development -- prisma db push
```

### If Using Vercel Postgres

For initial setup (development), use `db:push`:

```bash
npm run db:push
```

This syncs your schema to the database without creating migration files.

**Note:** For production or when you need versioned migrations, use `npm run db:migrate` instead (see [Database Migrations Guide](./database-migrations.md)).

## Step 5: Verify

```bash
npm run dev
```

Visit `http://localhost:3000` and test sign-in.

## Prisma 7 Configuration

This project uses Prisma 7, which requires:

- **`prisma.config.ts`**: Configuration file for datasource URL and migration settings
- **Adapter Pattern**: PrismaClient uses `@prisma/adapter-pg` for PostgreSQL connections
- **No URL in Schema**: The `url` property is no longer in `schema.prisma` (moved to `prisma.config.ts`)

See `prisma.config.ts` and `src/lib/prisma.ts` for implementation details.

## Production

1. Add `DATABASE_URL` to Vercel environment variables
2. Run migrations: `npx prisma migrate deploy`

## View Database

```bash
npm run db:studio
```

Opens at `http://localhost:5555`

**Note:** 
- If using Docker: Prisma Studio reads `DATABASE_URL` from your `.env.development` file
- If using Vercel Postgres: Prisma Studio reads `DATABASE_URL` from your `.env.local` file (loaded via `dotenv-cli`)
- The URL is not in `schema.prisma` for Prisma 7 compatibility

## Available Commands

### If Using Docker

- `docker compose up db -d` - Start Docker database
- `npm run db:migrate:dev` - Create and apply migration (recommended)
- `npm run db:push:dev` - Quick push (development, no migration files)
- `npm run db:studio:dev` - Open Prisma Studio (database GUI)
- `npm run db:dev:reset` - Reset development database (Docker only)
- `npx dotenv-cli -e .env.development -- prisma [command]` - Alternative direct command

### If Using Vercel Postgres

- `npm run db:push` - Sync schema to database (development)
- `npm run db:migrate` - Create and apply migration (recommended for production)
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:query` - Run custom database queries
