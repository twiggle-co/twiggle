# Documentation

Setup guides for the Twiggle Frontend application.

## Setup Guides

1. **[Vercel Postgres Setup](./guides/database-setup.md)** - Database setup with Prisma and Vercel Postgres
2. **[Google Auth Setup](./guides/google-auth.md)** - Configure Google OAuth credentials
3. **[Google Cloud Storage Setup](./guides/google-cloud-storage.md)** - File storage setup

## Database Guides

- **[Database Migrations](./guides/database-migrations.md)** - **Safely add, modify, or remove database fields and models**

## Design & Styling

- **[Color Palette](./guides/color-palette.md)** - **Centralized color definitions and usage guidelines**

## Getting Started

1. **Set up database** → [Vercel Postgres Setup](./guides/database-setup.md)
2. **Configure authentication** → [Google Auth Setup](./guides/google-auth.md)
3. **Set up file storage** → [Google Cloud Storage Setup](./guides/google-cloud-storage.md)
4. **Install dependencies** → `npm install`
5. **Start development** → `npm run dev`

## Making Database Changes

When you need to modify your database schema:
- **Read the [Database Migrations Guide](./guides/database-migrations.md)** first
- Follow best practices to avoid data loss
- Test migrations locally before deploying to production
