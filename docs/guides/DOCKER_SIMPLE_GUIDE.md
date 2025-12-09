# Docker - What to Do (Simple Guide)

## 🎯 What is Docker For?

Docker gives you a **local PostgreSQL database** without installing PostgreSQL on your computer. That's it!

- ✅ **Database in Docker** - PostgreSQL runs in a container
- ✅ **Next.js runs locally** - Your app runs on your machine (better performance)
- ✅ **No setup needed** - Database is ready to use

## 🚀 Quick Start (3 Steps)

### Step 1: Start the Database

```powershell
docker compose up db -d
```

This starts PostgreSQL in the background. You only need to do this once per day (or restart your computer).

**Check if it's running:**
```powershell
docker compose ps
```

You should see `twiggle-db` with status "Up".

### Step 2: Initialize Database (First Time Only)

If this is your first time, create the database tables:

```powershell
npm run db:migrate:dev
```

When prompted, name your migration (e.g., `init`).

**Or for quick development (no migration files):**
```powershell
npm run db:push:dev
```

### Step 3: Start Your App

```powershell
npm run dev
```

Visit `http://localhost:3000` - your app is running!

## 📋 Daily Workflow

**Every day when you start coding:**

1. Start database: `docker compose up db -d`
2. Start app: `npm run dev`

That's it! The database stays running until you stop it.

**When you're done coding:**

```powershell
# Stop database (optional - it's fine to leave it running)
docker compose down
```

## 🔧 Common Commands

```powershell
# Start database
docker compose up db -d

# Stop database
docker compose down

# Check if database is running
docker compose ps

# View database logs
docker compose logs db -f

# Reset database (⚠️ deletes all data)
npm run db:dev:reset

# Open database GUI (Prisma Studio)
npm run db:studio:dev
```

## ❓ Do I Need to Use Docker?

**You have 2 options:**

### Option 1: Use Docker (Recommended)
- ✅ Easy setup
- ✅ No PostgreSQL installation needed
- ✅ Consistent environment
- ✅ Good for teams

### Option 2: Use Vercel Postgres (Cloud)
- ✅ No Docker needed
- ✅ Database in the cloud
- ✅ See [Database Setup Guide](./docs/guides/database-setup.md)

**For local development, Docker is usually easier!**

## 🎯 What You're Actually Doing

```
Your Computer:
┌─────────────────┐
│  Next.js App    │  ← Runs on your machine (npm run dev)
│  (Port 3000)    │
└────────┬────────┘
         │
         │ Connects to
         ▼
┌─────────────────┐
│  PostgreSQL     │  ← Runs in Docker (docker compose up db)
│  (Port 5432)    │
└─────────────────┘
```

## ✅ Current Status Check

Run this to see what's running:

```powershell
docker compose ps
```

**If nothing is running:**
- Start database: `docker compose up db -d`
- Start app: `npm run dev`

**If database is running:**
- Just start app: `npm run dev`

## 🆘 Troubleshooting

### "Can't reach database"

**Solution:**
```powershell
docker compose up db -d
```

### "Port 5432 already in use"

**Solution:** You might have PostgreSQL installed locally. Either:
- Stop local PostgreSQL, OR
- Change port in `docker-compose.yml` (line 18: change `5432:5432` to `5434:5432`)

### Database not working?

**Reset it:**
```powershell
docker compose down -v
docker compose up db -d
npm run db:migrate:dev
```

## 📚 More Help

- [Complete Docker Guide](./docs/guides/docker-setup.md) - Full documentation
- [Database Setup](./docs/guides/database-setup.md) - Database configuration
- [Environment Setup](./ENV_SETUP.md) - Environment variables

## 🎉 That's It!

Docker is just a way to run PostgreSQL easily. Once it's running, you forget about it and just code!

**Remember:**
1. `docker compose up db -d` - Start database
2. `npm run dev` - Start your app
3. Code! 🚀

