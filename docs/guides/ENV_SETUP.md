# Environment Variables Reference

Quick reference for all environment variables needed for Twiggle.

## Required Variables

Create a `.env.local` file in the project root with these variables:

```env
# Database Connection
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Cloud Storage
GCS_PROJECT_ID="your-project-id"
GCS_BUCKET_NAME="your-bucket-name"
GCS_KEY_FILENAME="key/your-service-account-key.json"
```

## Variable Descriptions

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `NEXTAUTH_URL` | Base URL of your application | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret key for session encryption | Generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | From Google Cloud Console |
| `GCS_PROJECT_ID` | Google Cloud project ID | Your GCP project ID |
| `GCS_BUCKET_NAME` | Google Cloud Storage bucket name | `twiggle-files` |
| `GCS_KEY_FILENAME` | Path to service account JSON key | `key/service-account.json` |

## Quick Setup

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### For Local Development

Use local PostgreSQL:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/twiggle_dev?sslmode=disable"
```

### For Production

Use hosted PostgreSQL:
```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

## Getting Credentials

- **Database:** See [Database Setup Guide](./database-setup.md)
- **Google OAuth:** See [Google Auth Setup](./google-auth.md)
- **Google Cloud Storage:** See [GCS Setup](./google-cloud-storage.md)

## Security Notes

⚠️ **Important:**
- Never commit `.env.local` to git (it's in `.gitignore`)
- Use different secrets for development and production
- Rotate secrets if they're compromised
- Keep service account keys secure

## Production (Vercel)

For production, add these as environment variables in Vercel:

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add each variable
4. Redeploy your application

**Note:** For GCS in production, you may need to use `GCS_CREDENTIALS` (base64-encoded) instead of `GCS_KEY_FILENAME`. See [GCS Setup Guide](./google-cloud-storage.md) for details.
