# Quick Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Vercel Postgres

```bash
# Option A: Via CLI
vercel postgres create
vercel env pull .env.local

# Option B: Via Dashboard
# Go to Vercel → Your Project → Storage → Create Postgres
# Copy DATABASE_URL to .env.local
```

### 3. Create Environment File

Create `.env.local` file in project root:

```env
DATABASE_URL=your-vercel-postgres-url
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Note:** Next.js will automatically load `.env.local` for both Next.js and Prisma commands.

### 4. Set Up Database

```bash
npx prisma generate
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

✅ **Done!** Visit `http://localhost:3000` and sign in with Google.

## Full Documentation

- [Database Setup Guide](./database-setup.md) - Complete setup instructions
- [Google Auth Setup](./google-auth.md) - Configure Google OAuth
- [Documentation Index](../README.md) - All documentation

## Required Environment Variables

| Variable | Description | How to Get |
|----------|-------------|------------|
| `DATABASE_URL` | Vercel Postgres connection string | Vercel Dashboard → Storage → Postgres |
| `NEXTAUTH_URL` | Your app URL | `http://localhost:3000` (dev) or your domain (prod) |
| `NEXTAUTH_SECRET` | Secret key for NextAuth | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | [Google Cloud Console](https://console.cloud.google.com/) |

## What's Included

- ✅ User authentication (Google OAuth)
- ✅ User accounts in database
- ✅ Project CRUD operations
- ✅ Protected routes (`/dashboard`, `/project/*`)
- ✅ User-specific data access (users only see their own projects)

## Key Files

- **Prisma Schema**: `prisma/schema.prisma`
- **NextAuth Config**: `src/app/api/auth/[...nextauth]/route.ts`
- **API Routes**: `src/app/api/projects/*`
- **Dashboard**: `src/app/dashboard/page.tsx`
- **Project Pages**: `src/app/project/[id]/page.tsx`
- **Middleware**: `src/middleware.ts`

## Verify Installation

1. **Check Database**: `npm run db:studio` (opens at http://localhost:5555)
2. **Test Auth**: Sign in with Google
3. **Test Projects**: Create a project from dashboard
4. **Check Database**: Verify records in Prisma Studio

## Common Issues

**"PrismaClient is not configured"**
→ Run `npx prisma generate`

**"Cannot connect to database"**
→ Check `DATABASE_URL` in `.env.local` file

**"Authentication not working"**
→ Verify `NEXTAUTH_SECRET` and Google OAuth credentials

**"Projects not loading"**
→ Check browser console and verify user is authenticated

For detailed troubleshooting, see [Database Setup Guide](./database-setup.md)

