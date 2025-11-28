# Storing and Viewing Signed-In Users with Vercel Postgres

## Current Setup

Your NextAuth.js configuration currently uses **JWT sessions** (stored in cookies), which means:
- ✅ Users can sign in and sessions work
- ❌ User data is **not persisted** in a database
- ❌ You **cannot see a list of all users** who have signed in
- ❌ User data is only available during active sessions

## Solution: Add Vercel Postgres Database

This guide will walk you through setting up Vercel Postgres to store user data permanently.

---

## Step 1: Create Vercel Postgres Database

### In Vercel Dashboard

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (twiggle-frontend)
3. Navigate to the **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Choose a name (e.g., `twiggle-db`) and region
7. Click **Create**

### Get Connection String

After creation, Vercel will automatically:
- Create a `DATABASE_URL` environment variable
- Add it to your project settings
- Make it available in all environments (Production, Preview, Development)

**Note:** The connection string is automatically added to your Vercel project. You don't need to copy it manually.

---

## Step 2: Install Dependencies

In your project directory, install Prisma and the NextAuth adapter:

```bash
npm install @prisma/client @next-auth/prisma-adapter
npm install -D prisma
```

---

## Step 3: Initialize Prisma

Run Prisma initialization:

```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` - Database schema file
- `.env` file (if it doesn't exist) - For local development

---

## Step 4: Configure Prisma Schema

Update `prisma/schema.prisma` with the NextAuth.js schema:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
  sessions      Session[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

**Key additions:**
- `createdAt` and `updatedAt` timestamps for tracking when users signed up
- All required NextAuth.js models (Account, Session, User, VerificationToken)

---

## Step 5: Set Up Local Development

### For Local Development

Add `DATABASE_URL` to your `.env.local` file:

```env
# Get this from Vercel Dashboard > Storage > Your Database > .env.local
# Or use the connection string from Vercel
DATABASE_URL="postgresql://..."
```

**To get the connection string:**
1. Go to Vercel Dashboard > Your Project > Storage
2. Click on your Postgres database
3. Go to the **.env.local** tab
4. Copy the connection string

### Run Migrations Locally

```bash
# Create and apply the database schema
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

This will:
- Create all tables in your Vercel Postgres database
- Generate the Prisma Client for TypeScript

---

## Step 6: Update NextAuth Configuration

Update `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      // Add user ID to session
      if (session.user && user) {
        session.user.id = user.id
      }
      return session
    },
  },
}

const { handlers } = NextAuth(authOptions)
export const { GET, POST } = handlers
```

**Key changes:**
- Import `PrismaAdapter` and `PrismaClient`
- Add `adapter: PrismaAdapter(prisma)` to `authOptions`
- Update session callback to use `user` parameter (from database) instead of `token`

---

## Step 7: Deploy to Vercel

### Push Changes to Git

```bash
git add .
git commit -m "Add Prisma and Vercel Postgres for user storage"
git push
```

### Vercel Will Automatically:

1. Detect the `DATABASE_URL` environment variable (already set in Vercel)
2. Run `prisma generate` during build
3. Your database is ready to use!

### Run Migrations on Production

After deployment, run migrations on your production database:

**Option A: Via Vercel CLI (Recommended)**

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

**Option B: Via Vercel Dashboard**

1. Go to your project in Vercel Dashboard
2. Open the terminal/console (if available)
3. Or use Vercel's deployment logs to verify migrations

**Note:** For production, use `prisma migrate deploy` instead of `prisma migrate dev`.

---

## Step 8: Create API to View All Users

Create `src/app/api/users/route.ts`:

```typescript
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
  // Optional: Add authentication check
  const session = await getServerSession(authOptions)
  
  // Uncomment to restrict to authenticated users only
  // if (!session) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // }

  // Uncomment to restrict to admin users only
  // if (session?.user?.email !== "admin@example.com") {
  //   return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  // }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            accounts: true,
            sessions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Newest users first
      },
    })

    return NextResponse.json({
      count: users.length,
      users,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}
```

**Access the API:**
- Local: `http://localhost:3000/api/users`
- Production: `https://your-domain.com/api/users`

---

## Step 9: Test the Setup

### 1. Sign In with Google

1. Go to your application
2. Click "Login"
3. Sign in with Google
4. User should be created in database automatically

### 2. Check Database

**Via API:**
```bash
curl http://localhost:3000/api/users
```

**Via Prisma Studio (Local):**
```bash
npx prisma studio
```
This opens a GUI at `http://localhost:5555` to view your database.

**Via Vercel Dashboard:**
1. Go to Storage > Your Postgres Database
2. Use the built-in SQL editor to query:
```sql
SELECT * FROM "User" ORDER BY "createdAt" DESC;
```

### 3. Verify User Storage

After signing in, check:
- ✅ User appears in database
- ✅ Session is stored
- ✅ Account is linked to user
- ✅ Can query users via API

---

## Viewing Users

### Method 1: API Endpoint (Recommended)

Access `/api/users` to get a JSON list of all users:

```json
{
  "count": 5,
  "users": [
    {
      "id": "clx...",
      "name": "John Doe",
      "email": "john@example.com",
      "image": "https://...",
      "emailVerified": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "_count": {
        "accounts": 1,
        "sessions": 1
      }
    }
  ]
}
```

### Method 2: Prisma Studio (Local Development)

```bash
npx prisma studio
```

Opens a web interface to browse your database.

### Method 3: Vercel Dashboard SQL Editor

1. Go to Vercel Dashboard > Storage > Your Postgres Database
2. Click on **"Data"** or **"SQL Editor"** tab
3. Run queries:
```sql
-- View all users
SELECT id, name, email, "createdAt" FROM "User" ORDER BY "createdAt" DESC;

-- Count total users
SELECT COUNT(*) FROM "User";

-- View users with their accounts
SELECT u.email, u.name, a.provider, a."providerAccountId"
FROM "User" u
LEFT JOIN "Account" a ON u.id = a."userId";
```

---

## Troubleshooting

### Issue: "DATABASE_URL is not set"

**Solution:**
1. Check Vercel Dashboard > Settings > Environment Variables
2. Ensure `DATABASE_URL` is set for all environments
3. Redeploy after adding environment variables

### Issue: "Prisma Client not generated"

**Solution:**
```bash
npx prisma generate
```

### Issue: "Migration failed"

**Solution:**
```bash
# Reset and re-run migrations (⚠️ deletes all data)
npx prisma migrate reset

# Or create a new migration
npx prisma migrate dev --name fix-schema
```

### Issue: "Connection timeout"

**Solution:**
- Check Vercel Postgres is running (Vercel Dashboard > Storage)
- Verify `DATABASE_URL` is correct
- Check network/firewall settings

### Issue: "Users not being created"

**Solution:**
1. Check NextAuth adapter is configured correctly
2. Verify Prisma Client is generated: `npx prisma generate`
3. Check browser console for errors
4. Verify Google OAuth is working

---

## Next Steps

### Add Custom User Fields

You can extend the User model in `prisma/schema.prisma`:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Add custom fields
  role          String    @default("user")
  bio           String?
  preferences   Json?
  
  accounts      Account[]
  sessions      Session[]
}
```

Then run:
```bash
npx prisma migrate dev --name add-custom-fields
npx prisma generate
```

### Create Admin Dashboard

Create a page to view and manage users:

```typescript
// src/app/admin/users/page.tsx
"use client"

import { useEffect, useState } from "react"

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => setUsers(data.users))
  }, [])

  return (
    <div>
      <h1>Users ({users.length})</h1>
      <table>
        {/* Render users */}
      </table>
    </div>
  )
}
```

---

## Cost

**Vercel Postgres Pricing:**
- **Hobby Plan**: $20/month
  - 1 GB storage
  - 60 hours compute/month
  - Good for small to medium apps

- **Pro Plan**: $20/month + usage
  - More storage and compute
  - Better for larger apps

**For most apps, the Hobby plan ($20/month) is sufficient.**

---

## Summary

✅ **What you've set up:**
- Vercel Postgres database
- Prisma ORM for database access
- NextAuth.js with database adapter
- User data persistence
- API endpoint to view users

✅ **What happens now:**
- Every user who signs in is stored in the database
- Sessions are persisted (survive server restarts)
- You can query and view all users
- User data is permanent (not just in cookies)

✅ **Next time a user signs in:**
- NextAuth checks if user exists in database
- If exists: Updates session
- If new: Creates new user record
- All automatically handled!

---

## Quick Reference

**Common Commands:**
```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name migration-name

# Apply migrations to production
npx prisma migrate deploy

# Open database GUI
npx prisma studio

# View database in Vercel
# Go to: Vercel Dashboard > Storage > Your Database
```

**Important Files:**
- `prisma/schema.prisma` - Database schema
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth config
- `src/app/api/users/route.ts` - Users API endpoint

**Environment Variables:**
- `DATABASE_URL` - Automatically set by Vercel Postgres
- `GOOGLE_CLIENT_ID` - Google OAuth
- `GOOGLE_CLIENT_SECRET` - Google OAuth

---

That's it! Your users are now being stored in Vercel Postgres. 🎉
