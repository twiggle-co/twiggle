# Quick Fix: OpenSSL Error in Vercel

## Error You're Seeing

```
Error: error:1E08010C:DECODER routines::unsupported
code: 'ERR_OSSL_UNSUPPORTED'
```

This error occurs when Node.js 17+ tries to use OpenSSL 3.0 with the Google Cloud Storage library.

## Immediate Fix (5 minutes)

### Step 1: Go to Vercel Dashboard
1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **twiggle-frontend** project

### Step 2: Add Environment Variable
1. Click **Settings** (in the top navigation)
2. Click **Environment Variables** (in the left sidebar)
3. Click **Add New** button
4. Fill in:
   - **Key**: `NODE_OPTIONS`
   - **Value**: `--openssl-legacy-provider`
   - **Environments**: Check all three:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
5. Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Find your latest deployment
3. Click the **three dots** (⋯) menu
4. Click **Redeploy**
5. Wait for deployment to complete

### Step 4: Test
1. Try saving a workflow again
2. The error should be resolved

## Why This Works

Node.js 17+ uses OpenSSL 3.0, which removed support for legacy cryptographic algorithms. The `--openssl-legacy-provider` flag tells Node.js to use the legacy provider, which is compatible with the Google Cloud Storage library.

## Verification

After redeploying, check your Vercel function logs. You should no longer see the `ERR_OSSL_UNSUPPORTED` error.

## Still Having Issues?

If the error persists after setting `NODE_OPTIONS` and redeploying:

1. **Verify the environment variable is set:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Confirm `NODE_OPTIONS` is listed with value `--openssl-legacy-provider`
   - Make sure it's enabled for Production environment

2. **Check deployment logs:**
   - Go to Deployments → Latest deployment → Functions tab
   - Look for any errors during the build or runtime

3. **Try a fresh deployment:**
   - Sometimes a full redeploy helps
   - Go to Deployments → Click "Redeploy" → Select "Use existing Build Cache" = OFF

## Reference

- [Stack Overflow Solution](https://stackoverflow.com/questions/74797727/error-error0308010cdigital-envelope-routinesunsupported)
- [Node.js OpenSSL Legacy Provider](https://nodejs.org/api/cli.html#--openssl-legacy-provider)

