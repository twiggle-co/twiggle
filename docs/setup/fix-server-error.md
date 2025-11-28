# Fix: Server Configuration Error

## Quick Diagnosis

The "There is a problem with the server configuration" error means **required environment variables are missing**.

## Required Variables

Create a `.env.local` file in your project root with:

```env
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Step-by-Step Fix

### 1. Create `.env.local` file

```powershell
# In PowerShell, from project root:
New-Item -Path .env.local -ItemType File
```

### 2. Add Required Variables

Open `.env.local` and add:

#### DATABASE_URL
- Get from Vercel Postgres or Neon dashboard
- Example: `postgresql://default:password@ep-xxx.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require`

#### NEXTAUTH_SECRET
Generate one:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```
Or use: https://generate-secret.vercel.app/32

#### GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET
- Get from Google Cloud Console
- See [Google Auth Setup](./google-auth.md)

### 3. Verify

```powershell
# Check file exists
Test-Path .env.local

# View variables
Get-Content .env.local
```

### 4. Restart Dev Server

```powershell
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

## Most Common Issues

1. **File doesn't exist** → Create `.env.local`
2. **Wrong location** → Must be in project root (same folder as `package.json`)
3. **Wrong name** → Must be `.env.local` (not `.env.local.txt`)
4. **Missing variables** → All 5 variables are required
5. **Typo in variable names** → Check spelling exactly
6. **Server not restarted** → Restart after creating/editing `.env.local`

