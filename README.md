# Twiggle

A Next.js application for creating and managing node-based workflows with file storage and Google authentication.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd twiggle

# Install dependencies
npm install

# Set up environment variables (see docs)
cp .env.example .env.local  # Edit with your credentials

# Initialize database
npm run db:migrate

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## 📚 Documentation

**👉 [Complete Documentation & Setup Guide](./docs/README.md)** - Start here for detailed setup instructions!

### Quick Links

- **[Getting Started](./docs/README.md#complete-setup-guide)** - Complete setup walkthrough
- **[Database Setup](./docs/guides/database-setup.md)** - PostgreSQL configuration
- **[Google Authentication](./docs/guides/google-auth.md)** - OAuth setup
- **[Google Cloud Storage](./docs/guides/google-cloud-storage.md)** - File storage setup
- **[Code Structure](./docs/guides/code-structure.md)** - Understanding the codebase
- **[Database Migrations](./docs/guides/database-migrations.md)** - Modifying database schema

## Features

- **Node-based Workflow Editor** - Interactive canvas using React Flow
- **File Upload & Storage** - Upload and manage files via Google Cloud Storage
- **User Authentication** - Google OAuth login via NextAuth.js
- **Project Management** - Organize workflows into projects
- **Real-time Updates** - Auto-save and workflow persistence

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Canvas:** [React Flow](https://xyflow.com/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Database:** PostgreSQL with [Prisma](https://www.prisma.io/)
- **Storage:** Google Cloud Storage
- **Deployment:** Vercel

## Project Structure

```
twiggle/
├── src/
│   ├── app/              # Next.js App Router (pages & API routes)
│   ├── components/       # React components
│   ├── lib/              # Utility functions and helpers
│   └── types/            # TypeScript type definitions
├── docs/                 # Documentation
├── prisma/               # Database schema and migrations
└── public/               # Static assets
```

See [Code Structure Guide](./docs/guides/code-structure.md) for detailed explanation.

## Environment Variables

Required environment variables (see [setup guides](./docs) for details):

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Storage
GCS_PROJECT_ID="your-project-id"
GCS_BUCKET_NAME="your-bucket-name"
GCS_KEY_FILENAME="key/your-key.json"
```

Create a `.env.local` file for local development. See [Database Setup](./docs/guides/database-setup.md) for details.

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

npm run db:migrate   # Create and apply database migration
npm run db:push      # Sync schema (development only)
npm run db:studio    # Open Prisma Studio (database GUI)
```

## Getting Help

- 📖 Read the [Complete Documentation](./docs/README.md)
- 🐛 Check [Troubleshooting](./docs/README.md#troubleshooting) section
- 💬 Ask questions in your team's communication channel

## License

Private project - All rights reserved
