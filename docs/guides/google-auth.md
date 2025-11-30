# Google Auth Setup

## Step 1: Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click **Create Credentials** > **OAuth client ID**
4. Configure OAuth consent screen (if prompted):
   - Choose **External**
   - Add scopes: `email`, `profile`
5. Create OAuth client ID:
   - Application type: **Web application**
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy **Client ID** and **Client Secret**

## Step 2: Environment Variables

Add to `.env.local`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

## Production

1. Add environment variables to Vercel:
   - `NEXTAUTH_URL` = `https://yourdomain.com`
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

2. Update Google OAuth redirect URI:
   - Add `https://yourdomain.com/api/auth/callback/google` in Google Cloud Console

3. Redeploy application
