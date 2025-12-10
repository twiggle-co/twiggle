# Google Authentication Setup

This guide explains how to configure Google OAuth authentication for Twiggle using NextAuth.js.

## What You'll Need

- A Google Cloud Platform account
- Access to Google Cloud Console
- About 10 minutes

## Step 1: Create OAuth Credentials in Google Cloud

### 1.1 Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)

### 1.2 Configure OAuth Consent Screen

1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace)
3. Fill in required information:
   - App name: "Twiggle" (or your app name)
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - `email`
   - `profile`
5. Save and continue through the steps

### 1.3 Create OAuth Client ID

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application** as the application type
4. Configure:

   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://yourdomain.com
   ```

   **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   https://yourdomain.com/api/auth/callback/google
   ```

5. Click **Create**
6. **Copy the Client ID and Client Secret** - you'll need these next!

## Step 2: Add Credentials to Environment Variables

Add these to your `.env.local` file:

```env
# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Copy the output and use it as your `NEXTAUTH_SECRET` value.

## Step 3: Test It

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000`
3. Try signing in with Google
4. You should be redirected to Google's login page
5. After signing in, you'll be redirected back to Twiggle

## Production Setup

### 1. Update Google OAuth Settings

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Edit your OAuth client
3. Add your production domain to:
   - **Authorized JavaScript origins:** `https://yourdomain.com`
   - **Authorized redirect URIs:** `https://yourdomain.com/api/auth/callback/google`

### 2. Update Environment Variables

In your hosting platform (e.g., Vercel), add:

```env
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-production-secret"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

**Important:** Use a different `NEXTAUTH_SECRET` for production! Generate a new one.

### 3. Redeploy

After adding environment variables, redeploy your application.

## How It Works

1. User clicks "Sign in with Google"
2. They're redirected to Google's login page
3. After authentication, Google redirects back to `/api/auth/callback/google`
4. NextAuth.js creates a session and stores it in the database
5. User is logged in!

## Troubleshooting

### "Redirect URI mismatch"

**Problem:** The redirect URI in your code doesn't match what's configured in Google Cloud.

**Solution:**
- Check that `NEXTAUTH_URL` matches your domain
- Verify the redirect URI in Google Cloud Console matches: `{NEXTAUTH_URL}/api/auth/callback/google`

### "Invalid client"

**Problem:** Client ID or Client Secret is incorrect.

**Solution:**
- Double-check the values in `.env.local`
- Make sure there are no extra spaces or quotes
- Regenerate credentials in Google Cloud Console if needed

### "OAuth consent screen not configured"

**Problem:** You need to configure the OAuth consent screen first.

**Solution:**
- Go to **APIs & Services** > **OAuth consent screen**
- Complete the configuration (see Step 1.2 above)

## Security Best Practices

1. **Never commit credentials** - `.env.local` is in `.gitignore` for a reason
2. **Use different secrets** - Use different `NEXTAUTH_SECRET` for development and production
3. **Rotate secrets** - If credentials are compromised, regenerate them immediately
4. **Limit redirect URIs** - Only add domains you actually use

## Next Steps

- ✅ Google authentication is working
- 📦 Set up [Google Cloud Storage](./google-cloud-storage.md) for file uploads
- 🗄️ Review [Database Setup](./database-setup.md) if needed
