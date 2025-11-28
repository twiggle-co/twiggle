# Database Setup Guide

Complete guide to setting up Prisma with Vercel Postgres for user authentication and data storage.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local file (see below)
# 3. Push schema to database
npm run db:push

# 4. Start development
npm run dev
```

## Step 1: Create Database

### Option A: Vercel Postgres (Recommended)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → Your Project
2. Click **Storage** tab → **Create Database** → **Postgres**
3. Name it and select region
4. Copy the connection string (shown after creation)

### Option B: Neon (Alternative)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a project (database auto-created)
3. Copy the connection string from dashboard

## Step 2: Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# Database Connection
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Get Your Values

- **DATABASE_URL**: From Vercel Postgres or Neon dashboard
- **NEXTAUTH_SECRET**: Generate with `openssl rand -base64 32` or use [online generator](https://generate-secret.vercel.app/32)
- **Google OAuth**: See [Google Auth Setup](./google-auth.md)

> **Note:** We use `.env.local` (Next.js standard). The npm scripts automatically load it for Prisma commands.

## Step 3: Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npm run db:push
```

This creates all required tables:
- `User` - User accounts
- `Account` - OAuth provider links
- `Session` - User sessions
- `Project` - User projects

## Step 4: Verify Setup

```bash
# Start development server
npm run dev

# (Optional) View database
npm run db:studio
```

Visit `http://localhost:3000` and test:
1. Sign in with Google
2. Create a project
3. Check database in Prisma Studio

## Database Schema

### User Model

Stores user account information from Google OAuth.

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  image         String?
  projects      Project[]
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Project Model

Stores user's projects.

```prisma
model Project {
  id          String   @id @default(cuid())
  title       String
  description String?  @default("")
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Security:** Projects are automatically filtered by `ownerId` - users can only access their own projects.

## Common Tasks

### Reset Database (Development Only)

⚠️ **Deletes all data!**

```bash
npx prisma migrate reset
```

### Update Schema

1. Edit `prisma/schema.prisma`
2. Run `npm run db:push` (dev) or `npm run db:migrate` (production)

### View Database

```bash
npm run db:studio
```

Opens visual database browser at `http://localhost:5555`

## Troubleshooting

### "Environment variable not found: DATABASE_URL"

**Fix:**
1. Create `.env.local` file in project root
2. Add `DATABASE_URL=...` (no spaces around `=`)
3. Restart terminal
4. Verify file exists: `Test-Path .env.local` (PowerShell)

### "Can't reach database server"

**Check:**
- Connection string is correct
- Includes `?sslmode=require` at the end
- Database is running (check provider dashboard)

### "PrismaClient is not configured"

```bash
npx prisma generate
```

## Production Deployment

### 1. Set Environment Variables in Vercel

Vercel Dashboard → Your Project → Settings → Environment Variables:
- `DATABASE_URL` - Production database URL
- `NEXTAUTH_URL` - Your production domain
- `NEXTAUTH_SECRET` - Different from dev
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

### 2. Update Google OAuth

Add production redirect URI in Google Cloud Console:
`https://yourdomain.com/api/auth/callback/google`

### 3. Deploy

```bash
git push
# Vercel auto-deploys
```

### 4. Run Migrations

```bash
npx prisma migrate deploy
```

## Provider Comparison

| Feature | Vercel Postgres | Neon |
|---------|----------------|------|
| Free Storage | 256MB | 10GB |
| Setup | Built into Vercel | Separate signup |
| Best For | Simple, integrated | More storage, flexibility |

Both work identically with Prisma - just change `DATABASE_URL`.

## Related Documentation

- [Google Auth Setup](./google-auth.md) - Configure Google OAuth
- [Storage Setup](./google-cloud-storage.md) - File storage setup

