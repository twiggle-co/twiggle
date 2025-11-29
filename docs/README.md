# Documentation

Setup guides and documentation for the Twiggle Frontend application.

## Quick Links

- [Quick Setup Guide](./setup/setup-quickstart.md) - **Start here** - 5-minute setup guide
- [Database Setup](./setup/database-setup.md) - Prisma + Vercel Postgres setup
- [Google Auth Setup](./setup/google-auth.md) - Configure Google OAuth credentials
- [Storage Setup](./setup/google-cloud-storage.md) - Google Cloud Storage for file uploads
- [GitHub Setup](./setup/github.md) - Git and GitHub configuration

## Setup Guides

### Essential Setup (Required)

1. **[Database Setup](./setup/database-setup.md)** ⭐
   - Prisma + Vercel Postgres
   - User authentication storage
   - Project data storage

2. **[Google Auth Setup](./setup/google-auth.md)**
   - Google OAuth credentials
   - NextAuth.js configuration

### Optional Setup

- **[Storage Setup](./setup/google-cloud-storage.md)** - File uploads and storage
- **[GitHub Setup](./setup/github.md)** - Version control setup

## Troubleshooting

- [Fix Server Configuration Error](./setup/fix-server-error.md) - Common environment variable issues

## Project Structure

```
twiggle-frontend/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/       # NextAuth routes
│   │   │   └── projects/   # Project API routes
│   │   ├── dashboard/      # Dashboard pages
│   │   └── project/        # Project pages
│   ├── lib/
│   │   └── prisma.ts       # Prisma client
│   └── middleware.ts       # Route protection
└── docs/
    └── setup/              # This documentation
```

## Getting Started

1. **Set up database** → [Database Setup Guide](./setup/database-setup.md)
2. **Configure authentication** → [Google Auth Setup](./setup/google-auth.md)
3. **Install dependencies** → `npm install`
4. **Start development** → `npm run dev`

For detailed instructions, see the individual setup guides above.

## Quick Database Access

**View your database with Prisma Studio:**
```bash
npm run db:studio
```
Opens at `http://localhost:5555` - a visual UI to browse, edit, and manage your database.

For production database access, see [Database Setup Guide](./setup/database-setup.md#accessing-database-in-production).
