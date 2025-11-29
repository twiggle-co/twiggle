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

### View Database with Prisma Studio

**Prisma Studio** is Prisma's built-in visual database browser. It provides a user-friendly interface to view, edit, and manage your database.

**For local development:**
```bash
npm run db:studio
```

This opens Prisma Studio at `http://localhost:5555` in your browser.

**Features:**
- ✅ Browse all tables and records
- ✅ View relationships between tables
- ✅ Edit records directly in the UI
- ✅ Add new records
- ✅ Delete records
- ✅ Filter and search data
- ✅ See real-time data changes

**For production database:**
See [Accessing Database in Production](#accessing-database-in-production) section below.

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

## Accessing Database in Production

There are several ways to view and manage your production database:

### Method 1: Prisma Studio (Recommended) ⭐

**Prisma Studio** is the easiest way to view and manage your database. It's a web-based UI that runs locally and connects to any database.

**Connect to Production Database:**

1. **Get production DATABASE_URL from Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Copy the `DATABASE_URL` value (or use Vercel CLI to pull it)

2. **Set DATABASE_URL temporarily:**
   ```bash
   # Option A: Set environment variable for this session
   $env:DATABASE_URL="your-production-database-url"  # PowerShell
   # or
   export DATABASE_URL="your-production-database-url"  # Bash/Mac
   
   # Option B: Use Vercel CLI to pull environment variables
   vercel env pull .env.production
   ```

3. **Open Prisma Studio:**
   ```bash
   npx prisma studio
   ```
   
   This opens a visual database browser at `http://localhost:5555` connected to your production database.

**What You Can Do in Prisma Studio:**
- 📊 Browse all tables (User, Project, Account, Session)
- 👁️ View all records with relationships
- ✏️ Edit records directly (be careful in production!)
- ➕ Add new records
- 🗑️ Delete records
- 🔍 Filter and search data
- 📈 See table statistics

**Screenshots of what you'll see:**
- Left sidebar: List of all tables
- Main area: Table data with rows and columns
- Click any row to view/edit details
- See relationships (e.g., User → Projects)

⚠️ **Warning:** Be careful when editing production data through Prisma Studio! Always verify you're connected to the right database.

### Method 2: Vercel Postgres Dashboard

If using Vercel Postgres:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → Your Project
2. Click **Storage** tab
3. Click on your Postgres database
4. Use the built-in SQL editor to run queries
5. View tables and data directly in the dashboard

### Method 3: Database Client Tools

Use a PostgreSQL client to connect directly:

**Popular Tools:**
- [TablePlus](https://tableplus.com/) (Mac/Windows/Linux)
- [pgAdmin](https://www.pgadmin.org/) (Free, cross-platform)
- [DBeaver](https://dbeaver.io/) (Free, cross-platform)
- [Postico](https://eggerapps.at/postico/) (Mac only)

**Connection Steps:**

1. Get connection string from Vercel:
   - Vercel Dashboard → Storage → Your Database → Connection String

2. Parse the connection string:
   ```
   postgresql://username:password@host:port/database?sslmode=require
   ```

3. Connect using your client:
   - **Host:** Extract from connection string
   - **Port:** Usually `5432`
   - **Database:** Extract from connection string
   - **Username:** Extract from connection string
   - **Password:** Extract from connection string
   - **SSL Mode:** `require` (important!)

### Method 4: Vercel CLI

Use Vercel CLI to run SQL queries:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Connect to database (if using Vercel Postgres)
vercel postgres connect
```

### Method 5: Direct SQL Queries via Prisma

Run SQL queries using Prisma:

```bash
# Set production DATABASE_URL
$env:DATABASE_URL="your-production-database-url"  # PowerShell

# Use Prisma to execute SQL
npx prisma db execute --stdin <<< "SELECT * FROM \"User\" LIMIT 10;"
```

Or use the provided query script:

**First, install tsx (if not already installed):**
```bash
npm install -D tsx
```

**Then run queries:**
```bash
# For local development (uses .env.local automatically)
npm run db:query

# For production (set DATABASE_URL first)
$env:DATABASE_URL="your-production-database-url"  # PowerShell
npm run db:query

# Or manually with tsx
npx tsx scripts/query-db.ts
```

The script (`scripts/query-db.ts`) includes examples of:
- Finding users by email domain (e.g., `endsWith: "@gmail.com"`)
- Counting users and projects
- Viewing recent users and projects
- Finding users with projects
- Searching users by name

You can modify the script to add your own custom queries.

### Quick Database Checks

#### Using SQL

**Check user count:**
```sql
SELECT COUNT(*) FROM "User";
```

**Check project count:**
```sql
SELECT COUNT(*) FROM "Project";
```

**View recent users:**
```sql
SELECT id, email, name, "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 10;
```

**View recent projects:**
```sql
SELECT p.id, p.title, p."ownerId", u.email, p."createdAt" 
FROM "Project" p 
JOIN "User" u ON p."ownerId" = u.id 
ORDER BY p."createdAt" DESC 
LIMIT 10;
```

#### Using Prisma Queries

**Find users by email domain:**
```typescript
const users = await prisma.user.findMany({
  where: {
    email: { endsWith: "@gmail.com" }
  },
})
```

**Find users with specific email:**
```typescript
const user = await prisma.user.findUnique({
  where: {
    email: "user@example.com"
  },
  include: {
    projects: true
  }
})
```

**Find users with projects:**
```typescript
const usersWithProjects = await prisma.user.findMany({
  where: {
    projects: {
      some: {}
    }
  },
  include: {
    projects: true
  }
})
```

**Count users:**
```typescript
const userCount = await prisma.user.count()
```

**Count projects per user:**
```typescript
const usersWithProjectCount = await prisma.user.findMany({
  include: {
    _count: {
      select: { projects: true }
    }
  }
})
```

**Find recent users:**
```typescript
const recentUsers = await prisma.user.findMany({
  take: 10,
  orderBy: {
    createdAt: 'desc'
  }
})
```

**Find projects by user:**
```typescript
const userProjects = await prisma.project.findMany({
  where: {
    ownerId: "user-id-here"
  },
  include: {
    owner: {
      select: {
        email: true,
        name: true
      }
    }
  }
})
```

**Search users by name:**
```typescript
const users = await prisma.user.findMany({
  where: {
    name: {
      contains: "John",
      mode: 'insensitive' // Case-insensitive search
    }
  }
})
```

### Security Best Practices

⚠️ **Important Security Notes:**

1. **Never commit production DATABASE_URL** to git
2. **Use read-only access** when possible for viewing data
3. **Be careful with DELETE/UPDATE** operations on production
4. **Always backup** before making schema changes
5. **Use environment variables** to switch between dev/prod databases
6. **Limit access** to production database credentials

### Troubleshooting Production Access

**"Connection refused" or "Can't reach database server"**
- Check if your IP is whitelisted (some providers require this)
- Verify the connection string is correct
- Ensure SSL mode is set to `require`

**"Authentication failed"**
- Verify username and password are correct
- Check if credentials have expired
- Regenerate connection string if needed

**"Database does not exist"**
- Verify database name in connection string
- Check if database was created in the correct region

## Related Documentation

- [Google Auth Setup](./google-auth.md) - Configure Google OAuth
- [Storage Setup](./google-cloud-storage.md) - File storage setup

