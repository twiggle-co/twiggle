# Twiggle Documentation

Welcome to Twiggle! This documentation will help you get started, understand the codebase, and contribute effectively.

## 🚀 Quick Start

Get up and running in 15 minutes:

1. **Install prerequisites** (Node.js 24+, PostgreSQL)
2. **Clone and install** → `git clone <repo> && cd twiggle && npm install`
3. **Set up environment** → Create `.env.local` with required variables
4. **Set up database** → Configure PostgreSQL connection
5. **Initialize database** → `npm run db:migrate`
6. **Start development** → `npm run dev`

👉 **New to the project?** Start with the [Complete Setup Guide](#complete-setup-guide) below.

---

## 📚 Complete Setup Guide

This guide walks you through everything needed to run Twiggle locally.

### What is Twiggle?

Twiggle is a Next.js application that provides:
- **Node-based workflow editor** using React Flow
- **Google OAuth authentication** via NextAuth.js
- **File storage** using Google Cloud Storage
- **PostgreSQL database** managed with Prisma ORM

### Prerequisites

Before you begin, make sure you have:

| Tool | Version | Purpose | Download |
|------|---------|---------|----------|
| **Node.js** | 24+ | Run the Next.js application | [nodejs.org](https://nodejs.org/) |
| **PostgreSQL** | Any | Database (local or hosted) | [postgresql.org](https://www.postgresql.org/download/) or use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Neon](https://neon.tech), [Supabase](https://supabase.com) |
| **Git** | Any | Version control | [git-scm.com](https://git-scm.com/) |
| **Code Editor** | - | Recommended: VS Code or Cursor | - |

**Verify installations:**
```bash
node --version    # Should be 24.x or higher
psql --version    # Should show PostgreSQL version (if using local)
git --version     # Should show Git version
```

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd twiggle
```

### Step 2: Install Dependencies

```bash
npm install
```

This automatically:
- Installs all npm packages
- Generates Prisma Client (via postinstall script)
- Applies any code patches

### Step 3: Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
# Database Connection
# For local PostgreSQL:
DATABASE_URL="postgresql://postgres:password@localhost:5432/twiggle_dev?sslmode=disable"

# For hosted PostgreSQL (Vercel Postgres, Neon, Supabase):
# DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (see Google Auth Setup guide)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Cloud Storage (see GCS Setup guide)
GCS_PROJECT_ID="your-project-id"
GCS_BUCKET_NAME="your-bucket-name"
GCS_KEY_FILENAME="key/your-service-account-key.json"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**💡 Need help getting credentials?**
- See [Google Auth Setup](./guides/google-auth.md) for OAuth credentials
- See [Google Cloud Storage Setup](./guides/google-cloud-storage.md) for GCS setup
- See [Database Setup](./guides/database-setup.md) for database configuration

### Step 4: Set Up Database

**Option A: Local PostgreSQL**

1. Install PostgreSQL if needed
2. Create a database:
   ```bash
   createdb twiggle_dev
   ```
3. Update `DATABASE_URL` in `.env.local` with your credentials

**Option B: Hosted PostgreSQL (Recommended for teams)**

1. Create a database on your provider:
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
   - [Neon](https://neon.tech)
   - [Supabase](https://supabase.com)
2. Copy the connection string
3. Update `DATABASE_URL` in `.env.local`

### Step 5: Initialize Database

Run the initial migration to create all database tables:

```bash
npm run db:migrate
```

When prompted, name your migration (e.g., `init`).

**Quick alternative (development only):**
```bash
npm run db:push
```
This syncs the schema without creating migration files. ⚠️ Only use in development!

### Step 6: Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) - you should see the app!

### ✅ Verification Checklist

Make sure everything works:

- [ ] Database is accessible (can connect to PostgreSQL)
- [ ] App starts without errors (`npm run dev`)
- [ ] Homepage loads at `http://localhost:3000`
- [ ] Google OAuth login works
- [ ] No database connection errors in console

---

## 📖 Detailed Guides

### Setup & Configuration

- **[Database Setup](./guides/database-setup.md)** - Complete PostgreSQL setup guide
- **[Google Authentication](./guides/google-auth.md)** - Configure Google OAuth
- **[Google Cloud Storage](./guides/google-cloud-storage.md)** - Set up file storage

### Development

- **[Code Structure](./guides/code-structure.md)** - Understand the codebase organization
- **[Database Migrations](./guides/database-migrations.md)** - Safely modify database schema
- **[Color Palette](./guides/color-palette.md)** - Design system colors

---

## 🛠️ Daily Workflow

### Starting Your Day

```bash
# 1. Pull latest changes
git pull

# 2. Install any new dependencies
npm install

# 3. Run any new migrations
npm run db:migrate

# 4. Start development server
npm run dev
```

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

3. **Test locally:**
   ```bash
   npm run dev
   # Test at http://localhost:3000
   ```

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin feature/your-feature-name
   ```

### Common Tasks

**Adding a New Feature:**
1. Read [Code Structure Guide](./guides/code-structure.md)
2. Create a new branch
3. Follow existing patterns
4. Test thoroughly
5. Create a pull request

**Modifying Database Schema:**
1. **Read [Database Migrations Guide](./guides/database-migrations.md) first!**
2. Edit `prisma/schema.prisma`
3. Create migration: `npm run db:migrate`
4. Test the migration
5. Commit both schema and migration files

**Adding a New Node Type (Canvas):**
1. Add node template in `src/components/canvas/nodeTemplates.ts`
2. Create node component in `src/components/canvas/nodes/components/`
3. Update `TwiggleNodeCard.tsx` to handle new type
4. Update types in `src/components/canvas/types.ts`

---

## 📋 Available Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database
```bash
npm run db:migrate   # Create and apply migration
npm run db:push      # Quick push (no migrations, dev only)
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:query     # Run custom database queries
```

---

## 🆘 Troubleshooting

### Common Issues

**"Can't reach database"**
- Make sure PostgreSQL is running (if using local)
- Check `.env.local` has correct `DATABASE_URL`
- Verify database credentials

**"Prisma Client not generated"**
```bash
npx prisma generate
```

**"Module not found"**
```bash
npm install
# Check if you're in the right directory
```

**"Port 5432 already in use"**
- Stop any other PostgreSQL instances
- Or use a different port in your `DATABASE_URL`

**Database Connection Issues:**
```bash
# Open Prisma Studio to inspect database
npm run db:studio

# Check database connection
psql $DATABASE_URL
```

**Reset Everything (⚠️ deletes all data):**
```bash
npx prisma migrate reset
```

---

## 🎯 Next Steps

After completing setup:

1. ✅ **Explore the codebase** - Read [Code Structure Guide](./guides/code-structure.md)
2. ✅ **Understand the canvas** - Look at `src/components/canvas/`
3. ✅ **Review database schema** - Check `prisma/schema.prisma`
4. ✅ **Pick a small task** - Start with a bug fix or small feature
5. ✅ **Ask questions** - Don't hesitate to ask for help!

---

## 📝 Development Standards

### Code Style
- Use TypeScript for all new code
- Follow existing patterns and conventions
- Use centralized utilities from `src/lib/`
- Import colors from `src/lib/colors` (not hardcoded)

### Git Workflow
- Create feature branches: `feature/description`
- Write clear commit messages
- Test before pushing
- Create pull requests for review

### Database Changes
- Always use migrations (not `db:push` in production)
- Test migrations locally first
- Never edit existing migration files
- Document breaking changes

---

## 🎉 You're Ready!

You should now be able to:
- ✅ Run the application locally
- ✅ Make code changes
- ✅ Modify the database schema
- ✅ Understand the codebase structure

Welcome to the team! Happy coding! 🚀
