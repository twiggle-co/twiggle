# Deployment Readiness Checklist

## ✅ Build Status
- **Build**: ✓ Passes (`npm run build` successful)
- **TypeScript**: ✓ No errors
- **Linting**: ✓ No errors

## ✅ Code Status
- **Migrations**: ✓ Present (`20250129000000_add_workflow_data_url`)
- **Gitignore**: ✓ Properly configured (excludes secrets, .env files, key/)
- **Dependencies**: ✓ All installed

## ⚠️ Required Environment Variables (Must Set in Vercel)

### Database
- [ ] `DATABASE_URL` - PostgreSQL connection string (from Vercel Postgres)

### Authentication (NextAuth.js)
- [ ] `NEXTAUTH_URL` - Your production domain (e.g., `https://your-app.vercel.app`)
- [ ] `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`

### Google OAuth
- [ ] `GOOGLE_CLIENT_ID` - From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- [ ] **Update Google OAuth redirect URI** to: `https://your-app.vercel.app/api/auth/callback/google`

### Google Cloud Storage
- [ ] `GCS_PROJECT_ID` - Your Google Cloud project ID
- [ ] `GCS_CREDENTIALS` - Service account JSON (as single-line string)
- [ ] `GCS_BUCKET_NAME` - Your GCS bucket name

## 📋 Pre-Deployment Steps

### 1. Database Migration
Run migrations on production database:
```bash
# After setting DATABASE_URL in Vercel, run:
npx prisma migrate deploy
```

Or use Vercel's build command to auto-run migrations:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma migrate deploy && next build"
  }
}
```

### 2. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Add production redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
4. Save changes

### 3. Vercel Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all required variables listed above
3. Set for **Production**, **Preview**, and **Development** as needed
4. **Important**: `GCS_CREDENTIALS` must be a single-line JSON string (no line breaks)

### 4. Vercel Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

## 🚀 Deployment Steps

1. **Push to Git** (if using Git integration):
   ```bash
   git push origin main
   ```

2. **Or deploy via Vercel CLI**:
   ```bash
   vercel --prod
   ```

3. **After deployment**:
   - Verify environment variables are set
   - Check function logs for any errors
   - Test authentication flow
   - Test file upload functionality
   - Test workflow save/load

## 🔍 Post-Deployment Verification

- [ ] Homepage loads
- [ ] Google OAuth login works
- [ ] Can create projects
- [ ] Can upload files
- [ ] Can save/load workflows
- [ ] Files are stored in GCS correctly
- [ ] Database queries work

## ⚠️ Common Issues

### Migration Errors
- Ensure `DATABASE_URL` is set correctly
- Run `npx prisma migrate deploy` manually if needed
- Check database connection string format

### OAuth Errors
- Verify redirect URI matches exactly (including `https://`)
- Check `NEXTAUTH_URL` matches your domain
- Ensure `NEXTAUTH_SECRET` is set

### GCS Errors
- Verify `GCS_CREDENTIALS` is valid JSON (single line)
- Check service account has proper permissions
- Verify bucket name is correct
- Check function logs for detailed error messages

## 📝 Notes

- The `postinstall` script in `package.json` automatically runs `prisma generate`
- Migrations should be run manually on first deployment: `npx prisma migrate deploy`
- All sensitive files (`.env*`, `key/`) are properly gitignored
- The application is ready for deployment once environment variables are configured

