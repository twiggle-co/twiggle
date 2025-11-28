# Local Development Setup Guide

## The Problem

When you try to login on `localhost`, it redirects to `https://www.twiggle.co/api/auth/error?error=Configuration` because NextAuth doesn't know you're running locally.

## The Solution

Create a `.env.local` file in the `twiggle-frontend` folder with localhost-specific values.

## Step-by-Step Setup

### 1. Create `.env.local` file

In PowerShell, from the `twiggle-frontend` directory:

```powershell
New-Item -Path .env.local -ItemType File
```

### 2. Add Required Environment Variables

Open `.env.local` and add these variables (use your actual values):

```env
# CRITICAL: Must be http://localhost:3000 for local development
NEXTAUTH_URL=http://localhost:3000

# Generate a secret (run the command below)
NEXTAUTH_SECRET=your-generated-secret-here

# Get these from Vercel or your deployment settings
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Get from your database provider (same as production)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

### 3. Generate NEXTAUTH_SECRET

Run this in PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Copy the output and paste it as the value for `NEXTAUTH_SECRET` in `.env.local`.

Or use: https://generate-secret.vercel.app/32

### 4. Get Your Values

**From Vercel Dashboard:**
1. Go to your Vercel project
2. Settings → Environment Variables
3. Copy the values for:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET` (or generate a new one for local)

**Important:** 
- `NEXTAUTH_URL` must be `http://localhost:3000` (NOT the production URL)
- All other values can be the same as production

### 5. Verify Google OAuth Redirect URI

Make sure your Google OAuth credentials include:
- **Authorized JavaScript origins:** `http://localhost:3000`
- **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`

Check in: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

### 6. Restart Your Dev Server

```powershell
# Stop the server (Ctrl+C if running)
# Then restart:
npm run dev
```

## How Web Developers Test Locally

1. **Separate Environment Files:**
   - `.env.local` - Local development (gitignored, never committed)
   - Vercel Environment Variables - Production/Preview

2. **Different URLs:**
   - Local: `http://localhost:3000`
   - Production: `https://www.twiggle.co`

3. **Same Credentials:**
   - Google OAuth credentials can be shared
   - Database can be shared (or use a local DB)
   - Secrets should be different for security

4. **Testing Flow:**
   - Develop locally with `.env.local`
   - Test on localhost before deploying
   - Deploy to Vercel (uses Vercel env vars)
   - Production uses production env vars

## Troubleshooting

### Still redirecting to production?

1. Check `.env.local` exists: `Test-Path .env.local`
2. Check `NEXTAUTH_URL` value: `Get-Content .env.local | Select-String NEXTAUTH_URL`
3. Make sure it says: `NEXTAUTH_URL=http://localhost:3000`
4. Restart your dev server completely

### Configuration error?

- Missing `NEXTAUTH_SECRET`
- Missing `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET`
- Missing `DATABASE_URL`
- Wrong `NEXTAUTH_URL` (should be `http://localhost:3000`)

### Google OAuth not working?

- Check redirect URI in Google Cloud Console
- Must include: `http://localhost:3000/api/auth/callback/google`
- Wait 1-2 minutes after updating Google Console

