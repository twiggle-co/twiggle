# Google User Login Setup Guide

## Recommended Solution: NextAuth.js (Auth.js)

NextAuth.js is the most popular authentication solution for Next.js applications. It provides:
- Easy Google OAuth integration
- Secure session management
- Built-in CSRF protection
- TypeScript support
- Works seamlessly with Next.js App Router

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
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-vercel-domain.vercel.app` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://your-vercel-domain.vercel.app/api/auth/callback/google` (for production)
6. Copy the **Client ID** and **Client Secret**

### 2. Environment Variables

Add to your `.env.local` (for development) and Vercel environment variables:

```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000  # For production, use your Vercel URL
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
      page.tsx               # Update to show user info
  components/
    auth/
      LoginButton.tsx        # Login/logout button component
```

## Implementation Files

See the implementation files created in the project.

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

1. Add all environment variables to Vercel:
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

2. Update Google OAuth redirect URIs to include your Vercel domain

3. Redeploy your application

## Alternative Solutions

### Option 2: Clerk (Easier, but paid)
- Very easy setup
- Pre-built UI components
- Free tier available
- More features out of the box

### Option 3: Firebase Auth
- Good if you're already using Firebase
- Free tier available
- Easy Google integration

### Option 4: Custom OAuth Implementation
- More control but more work
- Requires handling tokens, sessions, CSRF protection yourself

## Next Steps

1. Install NextAuth.js
2. Set up Google OAuth credentials
3. Add environment variables
4. Implement the auth route handler
5. Add login/logout UI components
6. Protect routes/pages as needed

