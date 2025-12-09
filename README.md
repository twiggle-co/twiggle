# Twiggle Frontend

Main site code for the Twiggle application.

## Getting Started

### Prerequisites

**Option 1: Docker (Recommended for teams)**
- Docker Desktop installed and running
- See [Docker Setup Guide](./docs/guides/docker-setup.md)

**Option 2: Local Development**
- Node.js 24+ (required for Prisma 7)
- npm, yarn, pnpm, or bun
- PostgreSQL database (or use Docker)

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Features

- **File Upload & Storage**: Upload files to Google Cloud Storage
- **User Authentication**: Google OAuth login via NextAuth.js
- **Canvas Interface**: Interactive node-based canvas for workflow management
- **File Preview**: Preview uploaded files in popout windows

## Documentation

Detailed setup guides are available in the [`/docs`](./docs) directory:

- **[Onboarding Guide](./docs/guides/onboarding.md)** - **NEW DEVELOPERS START HERE** - Complete setup process
- [Docker Setup](./docs/guides/docker-setup.md) - Docker setup for local development (recommended for teams)
- [Database Setup](./docs/guides/database-setup.md) - Prisma + Vercel Postgres
- [Database Migrations](./docs/guides/database-migrations.md) - Safely modify database schema
- [Google Authentication Setup](./docs/guides/google-auth.md) - Google OAuth configuration
- [Google Cloud Storage Setup](./docs/guides/google-cloud-storage.md) - File storage setup
- [Code Structure Guide](./docs/guides/code-structure.md) - Understanding the `/src` directory
- [Color Palette](./docs/guides/color-palette.md) - Design system colors

See the [Documentation Index](./docs/README.md) for complete documentation.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Canvas**: [React Flow](https://xyflow.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Storage**: Google Cloud Storage
- **Deployment**: Vercel

## Project Structure

```
twiggle-frontend/
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   ├── components/       # React components
│   ├── lib/              # Utility functions and helpers
│   ├── types/            # TypeScript type definitions
│   └── middleware.ts     # Next.js middleware
├── docs/                 # Documentation
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── key/                  # Local credentials (gitignored)
```

See [Code Structure Guide](./docs/guides/code-structure.md) for detailed explanation of the `/src` directory.

## Environment Variables

Required environment variables (see [setup guides](./docs) for details):

- `DATABASE_URL` - PostgreSQL connection string (Vercel Postgres)
- `NEXTAUTH_URL` - NextAuth.js base URL
- `NEXTAUTH_SECRET` - NextAuth.js secret key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GCS_PROJECT_ID` - Google Cloud project ID (for file storage)
- `GCS_CREDENTIALS` or `GCS_KEY_FILENAME` - Google Cloud Storage credentials (for file storage)
- `GCS_BUCKET_NAME` - Google Cloud Storage bucket name (for file storage)

Create a `.env.local` file for local development.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Flow Documentation](https://xyflow.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)

## License

Private project - All rights reserved
