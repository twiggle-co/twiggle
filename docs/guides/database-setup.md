# Database Setup Guide

This guide explains how to set up a PostgreSQL database for Twiggle. You can use either a local PostgreSQL installation or a hosted service.

## Quick Overview

Twiggle uses:
- **PostgreSQL** as the database
- **Prisma ORM** to manage the database schema
- **Prisma 7** with a special configuration file (`prisma.config.ts`)

## Choose Your Database Option

### Option 1: Local PostgreSQL (Good for solo development)

**Pros:** Full control, no internet required, free  
**Cons:** Requires installation, manual setup

**Steps:**
1. [Download PostgreSQL](https://www.postgresql.org/download/)
2. Install and start the service
3. Create a database:
   ```bash
   createdb twiggle_dev
   ```
4. Use connection string: `postgresql://postgres:password@localhost:5432/twiggle_dev?sslmode=disable`

### Option 2: Hosted PostgreSQL (Recommended for teams)

**Pros:** Easy setup, automatic backups, team-friendly  
**Cons:** Requires internet, may have costs

**Popular Providers:**
- **[Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)** - Best for Vercel deployments
- **[Neon](https://neon.tech)** - Serverless PostgreSQL
- **[Supabase](https://supabase.com)** - Open source Firebase alternative

**Steps:**
1. Create an account with your chosen provider
2. Create a new PostgreSQL database
3. Copy the connection string they provide
4. Use that connection string in your `.env.local`

## Step-by-Step Setup

### Step 1: Get Your Database Connection String

**For Local PostgreSQL:**
```env
DATABASE_URL="postgresql://postgres:your-password@localhost:5432/twiggle_dev?sslmode=disable"
```

**For Hosted PostgreSQL:**
Your provider will give you a connection string that looks like:
```env
DATABASE_URL="postgresql://user:password@host.region.provider.com:5432/database?sslmode=require"
```

### Step 2: Add to Environment Variables

Add the connection string to your `.env.local` file:

```env
# Database Connection
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 3: Install Dependencies

```bash
npm install
```

This automatically generates Prisma Client (via postinstall script).

### Step 4: Initialize Database Schema

Run the migration to create all database tables:

```bash
npm run db:migrate
```

When prompted, name your migration (e.g., `init`).

**What this does:**
- Creates a migration file in `prisma/migrations/`
- Applies the migration to your database
- Creates all tables defined in `prisma/schema.prisma`
- Regenerates Prisma Client

**Quick alternative (development only):**
```bash
npm run db:push
```
⚠️ **Warning:** This doesn't create migration files. Only use for quick prototyping in development!

### Step 5: Verify It Works

```bash
npm run dev
```

Visit `http://localhost:3000` and try signing in. If there are no database errors in the console, you're good to go!

## Viewing Your Database

### Prisma Studio (Visual Database Browser)

```bash
npm run db:studio
```

This opens a web interface at `http://localhost:5555` where you can:
- View all tables and data
- Edit records
- See relationships between tables

### Command Line

```bash
# Connect to database
psql $DATABASE_URL

# Or if using local PostgreSQL
psql -U postgres -d twiggle_dev
```

## Understanding Prisma 7

This project uses Prisma 7, which has some differences from earlier versions:

### Key Differences

1. **Configuration File:** Database URL is in `prisma.config.ts` (not `schema.prisma`)
2. **Adapter Pattern:** Uses `@prisma/adapter-pg` for PostgreSQL connections
3. **Migration System:** Same migration workflow, but configuration is separate

### Important Files

- `prisma/schema.prisma` - Your database schema (models, fields, relationships)
- `prisma.config.ts` - Database connection configuration
- `src/lib/prisma.ts` - Prisma Client instance used throughout the app

## Available Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run db:migrate` | Create and apply migration | **Recommended** - Use for all schema changes |
| `npm run db:push` | Sync schema without migrations | Development only - Quick prototyping |
| `npm run db:studio` | Open visual database browser | Anytime - View/edit data |
| `npm run db:query` | Run custom database queries | Debugging - Custom queries |

## Production Setup

For production deployments (e.g., Vercel):

1. **Add environment variable** in your hosting platform:
   - `DATABASE_URL` = Your production database connection string

2. **Run migrations** (usually automatic, but can be manual):
   ```bash
   npx prisma migrate deploy
   ```

3. **Verify** the database connection works in production

## Troubleshooting

### "Can't connect to database"

**Check:**
- Is PostgreSQL running? (for local)
- Is the connection string correct?
- Are credentials correct?
- Is the database created?

**Test connection:**
```bash
psql $DATABASE_URL
```

### "Prisma Client not generated"

```bash
npx prisma generate
```

### "Migration failed"

1. Check the error message
2. Verify your schema is valid: `npx prisma validate`
3. Check database permissions
4. For production, review migration files before applying

### "Port 5432 already in use"

- Stop other PostgreSQL instances
- Or change the port in your connection string

## Next Steps

- ✅ Database is set up and working
- 📖 Read [Database Migrations Guide](./database-migrations.md) to learn how to modify the schema
- 🔐 Set up [Google Authentication](./google-auth.md)
- 📦 Set up [Google Cloud Storage](./google-cloud-storage.md)
