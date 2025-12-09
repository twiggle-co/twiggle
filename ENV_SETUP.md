# Environment Files Setup

This file contains the content you need to create your environment files manually.

## .env.development

Create this file in the project root for Docker development:

```env
# Development Environment Variables
# This file is used when running with Docker Compose

# Database - Docker PostgreSQL
DATABASE_URL="postgresql://postgres:password@db:5432/twiggle_dev?sslmode=disable"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"

# Google OAuth (add your credentials)
# GOOGLE_CLIENT_ID="your-client-id"
# GOOGLE_CLIENT_SECRET="your-client-secret"

# Google Cloud Storage (add your credentials)
# GCS_PROJECT_ID="your-project-id"
# GCS_BUCKET_NAME="your-bucket-name"
# GCS_KEY_FILENAME="key/twiggle-479508-b9ea5eaacf83.json"
```

## .env.test

Create this file in the project root for testing:

```env
# Test Environment Variables
# This file is used when running automated tests

# Database - Docker PostgreSQL (test database)
DATABASE_URL="postgresql://postgres:password@localhost:5433/twiggle_test?sslmode=disable"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-secret-key"

# Google OAuth (test credentials if needed)
# GOOGLE_CLIENT_ID="test-client-id"
# GOOGLE_CLIENT_SECRET="test-client-secret"

# Google Cloud Storage (test credentials if needed)
# GCS_PROJECT_ID="test-project-id"
# GCS_BUCKET_NAME="test-bucket-name"
```

## .env.production.example

This file is already created. Copy it to `.env.production` and fill in your production values.

**Important**: Production should use a hosted PostgreSQL provider (Vercel Postgres, Neon, Supabase, or Cloud SQL), NOT Docker PostgreSQL.

## Quick Setup Commands

### Windows (PowerShell)
```powershell
# Create .env.development
@"
DATABASE_URL="postgresql://postgres:password@db:5432/twiggle_dev?sslmode=disable"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"
"@ | Out-File -FilePath .env.development -Encoding utf8

# Create .env.test
@"
DATABASE_URL="postgresql://postgres:password@localhost:5433/twiggle_test?sslmode=disable"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-secret-key"
"@ | Out-File -FilePath .env.test -Encoding utf8
```

### Linux/Mac
```bash
# Create .env.development
cat > .env.development << 'EOF'
DATABASE_URL="postgresql://postgres:password@db:5432/twiggle_dev?sslmode=disable"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"
EOF

# Create .env.test
cat > .env.test << 'EOF'
DATABASE_URL="postgresql://postgres:password@localhost:5433/twiggle_test?sslmode=disable"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-secret-key"
EOF
```

## Next Steps

1. Create the `.env.development` and `.env.test` files using the content above
2. Add your Google OAuth and GCS credentials to `.env.development`
3. Start Docker: `docker compose up -d`
4. Initialize database: `dotenv -e .env.development -- prisma migrate dev`
5. Start development: `npm run dev`

## Related Documentation

- [Docker Setup Guide](./docs/guides/docker-setup.md) - Complete Docker setup instructions
- [Database Setup Guide](./docs/guides/database-setup.md) - Database configuration
- [Google Auth Setup](./docs/guides/google-auth.md) - OAuth configuration
- [Google Cloud Storage Setup](./docs/guides/google-cloud-storage.md) - File storage setup

