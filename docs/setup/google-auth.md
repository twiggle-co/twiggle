# Google Authentication Setup

## Overview

This application uses NextAuth.js (Auth.js) for Google OAuth authentication. NextAuth.js provides secure session management, CSRF protection, and seamless integration with Next.js App Router.

## Installation

```bash
npm install next-auth@beta
```

Note: We're using the beta version (v5) which is compatible with Next.js 16 App Router.

## Setup Steps

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click **Create Credentials** > **OAuth client ID**
4. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in required fields (App name, User support email, Developer contact)
   - Add scopes: `email`, `profile`
   - Add test users if needed
5. Create OAuth client ID:
   - Application type: **Web application**
   - Name: `Twiggle Frontend`
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
6. Copy the **Client ID** and **Client Secret**

⚠️ **Important**: The redirect URIs must match **exactly** (including protocol `https://`, no trailing slashes)

### 2. Environment Variables

Add to your `.env.local` (for development) and Vercel environment variables:

```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000  # For local development
# For production: NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Generate NEXTAUTH_SECRET:**

**On Linux/Mac:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Or use an online generator:**
- Visit https://generate-secret.vercel.app/32 (official NextAuth.js secret generator)

### 3. File Structure

```
src/
  app/
    api/
      auth/
        [...nextauth]/
          route.ts          # Auth API route
    layout.tsx              # Update to include SessionProvider
    user/
      page.tsx              # Update to show user info
  components/
    auth/
      LoginButton.tsx        # Login/logout button component
```

## Usage in Components

```tsx
"use client"

import { useSession, signIn, signOut } from "next-auth/react"

export function UserProfile() {
  const { data: session, status } = useSession()

  if (status === "loading") return <div>Loading...</div>

  if (session) {
    return (
      <div>
        <p>Signed in as {session.user?.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    )
  }

  return (
    <button onClick={() => signIn("google")}>
      Sign in with Google
    </button>
  )
}
```

## Protecting API Routes

```tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Your protected route logic
}
```

## Protecting Pages

```tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/api/auth/signin")
  }

  return <div>Protected content</div>
}
```

## Vercel Deployment

1. **Add environment variables to Vercel:**
   - Go to your Vercel project → **Settings** → **Environment Variables**
   - Add the following:
     - `NEXTAUTH_URL` = `https://yourdomain.com` (your production domain)
     - `NEXTAUTH_SECRET` = (your generated secret)
     - `GOOGLE_CLIENT_ID` = (your Google OAuth client ID)
     - `GOOGLE_CLIENT_SECRET` = (your Google OAuth client secret)
   - Make sure to set these for **Production**, **Preview**, and **Development** environments

2. **Update Google OAuth redirect URIs:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Click on your OAuth 2.0 Client ID
   - Under **Authorized redirect URIs**, ensure you have:
     - `https://yourdomain.com/api/auth/callback/google`
   - Click **Save**

3. **Redeploy your application** after making changes

## Troubleshooting

### Error 400: redirect_uri_mismatch

This error occurs when the redirect URI in your request doesn't match what's configured in Google Cloud Console.

**To fix:**

1. **Check your current redirect URI:**
   - The redirect URI NextAuth uses is: `{NEXTAUTH_URL}/api/auth/callback/google`
   - For local: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`

2. **Verify in Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Click on your OAuth 2.0 Client ID
   - Check **Authorized redirect URIs** section
   - Make sure the exact URI is listed (case-sensitive, must include `https://`, no trailing slash)

3. **Common mistakes:**
   - ❌ `http://yourdomain.com/api/auth/callback/google` (wrong protocol - should be `https://`)
   - ❌ `https://yourdomain.com/api/auth/callback/google/` (trailing slash)
   - ✅ `https://yourdomain.com/api/auth/callback/google` (correct)

4. **After updating redirect URIs:**
   - Wait 1-2 minutes for changes to propagate
   - Clear your browser cache/cookies
   - Try signing in again

### ConnectTimeoutError / UND_ERR_CONNECT_TIMEOUT

This error occurs when NextAuth cannot connect to Google's OAuth token endpoint to exchange the authorization code for tokens.

**Symptoms:**
- Error: `ConnectTimeoutError` or `UND_ERR_CONNECT_TIMEOUT`
- Error: `TypeError: fetch failed`
- OAuth callback takes 10+ seconds and then fails

**Possible Causes:**

1. **Network/Firewall Blocking Outbound HTTPS:**
   - Corporate firewalls or network restrictions may block connections to `oauth2.googleapis.com`
   - Check if your network allows outbound HTTPS connections to Google's servers

2. **Proxy Configuration Needed:**
   - If you're behind a corporate proxy, you may need to configure Node.js to use it
   - Set environment variables:
     ```env
     HTTP_PROXY=http://proxy.company.com:8080
     HTTPS_PROXY=http://proxy.company.com:8080
     ```

3. **DNS Resolution Issues:**
   - Test if you can resolve Google's OAuth endpoint:
     ```bash
     # Test DNS resolution
     nslookup oauth2.googleapis.com
     # Test connectivity
     curl -I https://oauth2.googleapis.com/token
     ```

4. **VPN/Network Restrictions:**
   - If using a VPN, try disconnecting and testing
   - Some VPNs may block or interfere with OAuth token requests

**Solutions:**

1. **Check Network Connectivity:**
   ```bash
   # Test if you can reach Google's OAuth endpoint
   curl -v https://oauth2.googleapis.com/token
   ```

2. **Configure Proxy (if needed):**
   - Add proxy environment variables to your `.env.local` or system environment
   - Restart your development server after adding proxy settings

3. **Try Different Network:**
   - Test from a different network (e.g., mobile hotspot) to rule out network-specific issues
   - If it works on a different network, the issue is with your current network configuration

4. **Check Firewall/Antivirus:**
   - Temporarily disable firewall/antivirus to test if they're blocking the connection
   - If it works, add exceptions for Node.js and `oauth2.googleapis.com`

5. **Increase Timeout (already configured):**
   - The code now includes a 30-second timeout for token requests
   - If your network is slow, this may help, but the root cause should be addressed

**For Production (Vercel):**
- This error is less common in production as Vercel's servers have good connectivity
- If it occurs in production, check Vercel function logs for more details
- Verify that Vercel's IP ranges aren't blocked by any security policies

## Related Documentation

- [Database Setup](./database-setup.md) - Database configuration
- [Storage Setup](./google-cloud-storage.md) - File storage setup
