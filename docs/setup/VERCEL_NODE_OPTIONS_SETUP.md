# Setting NODE_OPTIONS in Vercel - Step by Step

## ⚠️ CRITICAL: This Must Be Done in Vercel Dashboard

The error you're seeing means `NODE_OPTIONS` is not set in your Vercel environment variables, or the deployment hasn't been redeployed after setting it.

## Exact Steps to Fix

### Step 1: Open Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Sign in if needed
3. Click on your **twiggle-frontend** project

### Step 2: Navigate to Environment Variables
1. Click **Settings** (top navigation bar)
2. Click **Environment Variables** (left sidebar, under "Configuration")

### Step 3: Add NODE_OPTIONS
1. Click the **"Add New"** button (or **"Add"** button)
2. In the **"Key"** field, type exactly: `NODE_OPTIONS`
3. In the **"Value"** field, type exactly: `--openssl-legacy-provider`
4. Under **"Environments"**, check ALL THREE boxes:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **"Save"**

### Step 4: Verify It Was Added
You should now see a row in the table with:
- **Name**: `NODE_OPTIONS`
- **Value**: `--openssl-legacy-provider` (may be hidden/masked)
- **Environments**: Production, Preview, Development

### Step 5: Redeploy (CRITICAL!)
Environment variables only take effect after redeployment:

1. Go to the **"Deployments"** tab (top navigation)
2. Find your latest deployment
3. Click the **three dots (⋯)** menu on the right
4. Click **"Redeploy"**
5. In the popup, you can leave "Use existing Build Cache" checked or unchecked
6. Click **"Redeploy"** button
7. Wait for the deployment to complete (watch the progress)

### Step 6: Test
1. After deployment completes, try saving a workflow again
2. The error should be gone

## Troubleshooting

### If the error persists after redeploying:

1. **Double-check the environment variable:**
   - Go back to Settings → Environment Variables
   - Verify `NODE_OPTIONS` is listed
   - Make sure it's enabled for **Production** environment
   - The value should be exactly `--openssl-legacy-provider` (no quotes, no spaces)

2. **Check deployment logs:**
   - Go to Deployments → Latest deployment
   - Click on the deployment
   - Check the "Build Logs" and "Function Logs" tabs
   - Look for any errors or warnings

3. **Try a fresh deployment:**
   - Go to Deployments
   - Click "Redeploy"
   - Uncheck "Use existing Build Cache"
   - Redeploy

4. **Verify the environment variable is being used:**
   - Add a temporary log in your code to check: `console.log('NODE_OPTIONS:', process.env.NODE_OPTIONS)`
   - Check the function logs after deployment
   - It should show: `NODE_OPTIONS: --openssl-legacy-provider`

## Alternative: Check via Vercel CLI

If you have Vercel CLI installed:

```bash
vercel env ls
```

This will show all environment variables. You should see `NODE_OPTIONS` listed.

## Why This Is Required

- Node.js 17+ uses OpenSSL 3.0
- OpenSSL 3.0 removed legacy algorithms
- Google Cloud Storage library uses these legacy algorithms
- `--openssl-legacy-provider` flag enables the legacy provider
- This flag must be set at the Node.js process level (via NODE_OPTIONS)

## Visual Guide

```
Vercel Dashboard
  └─ Your Project
      └─ Settings
          └─ Environment Variables
              └─ Add New
                  Key: NODE_OPTIONS
                  Value: --openssl-legacy-provider
                  Environments: ✅ Production ✅ Preview ✅ Development
                  └─ Save
                      └─ Deployments → Redeploy
```

## Still Not Working?

If you've followed all steps and the error persists:

1. Check Vercel's status page for any service issues
2. Try contacting Vercel support with:
   - Your project name
   - The error message
   - Confirmation that NODE_OPTIONS is set
   - Deployment logs

