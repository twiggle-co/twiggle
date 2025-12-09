# Documentation

Complete documentation for the Twiggle Frontend application.

## Quick Start

1. **Set up database** → [Database Setup](./guides/database-setup.md) or [Docker Setup](./guides/docker-setup.md)
2. **Configure authentication** → [Google Auth Setup](./guides/google-auth.md)
3. **Set up file storage** → [Google Cloud Storage Setup](./guides/google-cloud-storage.md)
4. **Install dependencies** → `npm install`
5. **Start development** → `npm run dev`

## Setup Guides

### Development Environment
- **[Docker Setup](./guides/docker-setup.md)** - Docker setup for local development (recommended for teams)
- **[Database Setup](./guides/database-setup.md)** - Prisma + Vercel Postgres setup
- **[Environment Setup](../ENV_SETUP.md)** - Environment variable configuration

### Services & Integrations
- **[Google Authentication](./guides/google-auth.md)** - Configure Google OAuth credentials
- **[Google Cloud Storage](./guides/google-cloud-storage.md)** - File storage setup

### Database Management
- **[Database Migrations](./guides/database-migrations.md)** - Safely add, modify, or remove database fields and models

## Development Guides

### Code & Architecture
- **[Code Structure](./guides/code-structure.md)** - Understanding the `/src` directory and codebase organization
- **[Color Palette](./guides/color-palette.md)** - Centralized color definitions and usage guidelines

## Best Practices

### Making Database Changes
When you need to modify your database schema:
- **Read the [Database Migrations Guide](./guides/database-migrations.md)** first
- Follow best practices to avoid data loss
- Test migrations locally before deploying to production

### Code Organization
- **Read the [Code Structure Guide](./guides/code-structure.md)** to understand the codebase
- Follow existing patterns when adding new features
- Use centralized utilities from `/src/lib`
