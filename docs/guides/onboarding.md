# New Developer Onboarding Guide

Welcome to the Twiggle Frontend project! This guide will help you get set up and start contributing.

## 🎯 Overview

Twiggle is a Next.js application with:
- **Node-based workflow editor** (React Flow)
- **Google OAuth authentication** (NextAuth.js)
- **File storage** (Google Cloud Storage)
- **PostgreSQL database** (Prisma ORM)

## ⏱️ Quick Setup (15 minutes)

### Step 1: Prerequisites

Install these tools on your machine:

- **Node.js 24+** - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download](https://git-scm.com/)
- **Code Editor** - VS Code recommended

**Verify installations:**
```bash
node --version    # Should be 24.x or higher
docker --version  # Should show Docker version
git --version     # Should show Git version
```

### Step 2: Clone the Repository

```bash
git clone <repository-url>
cd twiggle-frontend
```

### Step 3: Install Dependencies

```bash
npm install
```

This will:
- Install all npm packages
- Generate Prisma Client (via postinstall script)
- Apply any code patches

### Step 4: Set Up Environment Variables

Create `.env.development` in the project root:

```env
# Database - Docker PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/twiggle_dev?sslmode=disable"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"

# Google OAuth (get from team lead or see Google Auth Setup guide)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Cloud Storage (get from team lead or see GCS Setup guide)
GCS_PROJECT_ID="your-project-id"
GCS_BUCKET_NAME="your-bucket-name"
GCS_KEY_FILENAME="key/your-service-account-key.json"
```

**💡 Tip:** Ask your team lead for:
- Google OAuth credentials (or see [Google Auth Setup](./google-auth.md))
- GCS credentials and service account key file (or see [GCS Setup](./google-cloud-storage.md))

### Step 5: Start Docker Database

```bash
# Start PostgreSQL database
docker compose up db -d

# Verify it's running
docker compose ps
```

You should see `twiggle-db` with status "Up (healthy)".

### Step 6: Initialize Database

```bash
# Create database tables (first time only)
npm run db:migrate:dev
```

When prompted, name your migration (e.g., `init`).

**Alternative (quick dev, no migration files):**
```bash
npm run db:push:dev
```

### Step 7: Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` - you should see the app!

## ✅ Verification Checklist

Make sure everything works:

- [ ] Database is running: `docker compose ps` shows `twiggle-db` as healthy
- [ ] App starts: `npm run dev` runs without errors
- [ ] App loads: `http://localhost:3000` shows the homepage
- [ ] Can sign in: Google OAuth login works
- [ ] Database connection: No connection errors in console

## 📚 Learn the Codebase

### Essential Reading (in order)

1. **[Code Structure Guide](./code-structure.md)** - Understand how the code is organized
2. **[Docker Setup Guide](./docker-setup.md)** - How Docker works in this project
3. **[Database Migrations Guide](./database-migrations.md)** - How to modify the database safely

### Key Concepts

**App Router Structure:**
- Pages: `src/app/` directory
- API Routes: `src/app/api/` directory
- Components: `src/components/` directory
- Utilities: `src/lib/` directory

**Canvas/Workflow System:**
- Main component: `src/components/canvas/NodeCanvas.tsx`
- Node types: `src/components/canvas/nodes/`
- Canvas hooks: `src/components/canvas/hooks/`

**Database:**
- Schema: `prisma/schema.prisma`
- Client: `src/lib/prisma.ts`
- Migrations: `prisma/migrations/`

## 🛠️ Daily Workflow

### Starting Your Day

```bash
# 1. Pull latest changes
git pull

# 2. Install any new dependencies
npm install

# 3. Start database
docker compose up db -d

# 4. Run any new migrations
npm run db:migrate:dev

# 5. Start development server
npm run dev
```

### Making Changes

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

3. **Test locally:**
   ```bash
   npm run dev
   # Test your changes at http://localhost:3000
   ```

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin feature/your-feature-name
   ```

### Ending Your Day

```bash
# Stop database (optional - it's fine to leave it running)
docker compose down
```

## 🔧 Common Tasks

### Adding a New Feature

1. Read [Code Structure Guide](./code-structure.md) to understand where code goes
2. Create a new branch
3. Add your feature following existing patterns
4. Test thoroughly
5. Create a pull request

### Modifying Database Schema

1. **Read [Database Migrations Guide](./database-migrations.md) first!**
2. Edit `prisma/schema.prisma`
3. Create migration: `npm run db:migrate:dev`
4. Test the migration
5. Commit both schema and migration files

### Adding a New Node Type (Canvas)

1. Add node template in `src/components/canvas/nodeTemplates.ts`
2. Create node component in `src/components/canvas/nodes/components/`
3. Update `TwiggleNodeCard.tsx` to handle new type
4. Update types in `src/components/canvas/types.ts`

### Debugging

**Database Issues:**
```bash
# Check database logs
docker compose logs db

# Open Prisma Studio (database GUI)
npm run db:studio:dev
```

**App Issues:**
- Check browser console for client errors
- Check terminal for server errors
- Check network tab for API issues

**Reset Everything:**
```bash
# Reset database (⚠️ deletes all data)
npm run db:dev:reset
npm run db:migrate:dev
```

## 📖 Available Commands

### Docker Commands
```bash
npm run docker:up          # Start all services
npm run docker:down        # Stop all services
docker compose ps          # Check container status
docker compose logs db      # View database logs
```

### Database Commands (Docker)
```bash
npm run db:migrate:dev     # Create and apply migration
npm run db:push:dev        # Quick push (no migrations)
npm run db:studio:dev      # Open Prisma Studio GUI
npm run db:dev:reset       # Reset database (⚠️ deletes data)
```

### Development Commands
```bash
npm run dev                # Start development server
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run ESLint
```

## 🆘 Getting Help

### Documentation

- **[Code Structure](./code-structure.md)** - Codebase organization
- **[Docker Setup](./docker-setup.md)** - Docker configuration
- **[Database Setup](./database-setup.md)** - Database configuration
- **[Database Migrations](./database-migrations.md)** - Schema changes
- **[Google Auth Setup](./google-auth.md)** - OAuth configuration
- **[GCS Setup](./google-cloud-storage.md)** - File storage setup
- **[Color Palette](./color-palette.md)** - Design system

### Common Issues

**"Can't reach database"**
- Make sure Docker is running: `docker compose up db -d`
- Check `.env.development` has correct `DATABASE_URL`

**"dotenv is not recognized"**
- Use `npx dotenv-cli` or npm scripts: `npm run db:migrate:dev`

**"Port 5432 already in use"**
- Stop local PostgreSQL or change port in `docker-compose.yml`

**"Prisma Client not generated"**
- Run: `npx prisma generate`

**"Module not found"**
- Run: `npm install`
- Check if you're in the right directory

### Ask for Help

- Check existing documentation first
- Search the codebase for similar implementations
- Ask your team lead or other developers
- Check GitHub issues/discussions

## 🎯 Next Steps

After completing setup:

1. ✅ **Explore the codebase** - Read [Code Structure Guide](./code-structure.md)
2. ✅ **Understand the canvas** - Look at `src/components/canvas/`
3. ✅ **Review database schema** - Check `prisma/schema.prisma`
4. ✅ **Pick a small task** - Start with a bug fix or small feature
5. ✅ **Ask questions** - Don't hesitate to ask for help!

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

## 🎉 You're Ready!

You should now be able to:
- ✅ Run the application locally
- ✅ Make code changes
- ✅ Modify the database schema
- ✅ Understand the codebase structure

Welcome to the team! Happy coding! 🚀

