# Vercel Environment Variables Issues Found

## Issues Identified

### 1. GCS_CREDENTIALS Format Issue

**Current Status:**
- ✓ Valid JSON format
- ✓ Contains all required fields (type, project_id, private_key, client_email)
- ⚠️ Private key contains literal `\n` characters (backslash + n) instead of actual newlines
- ⚠️ JWT signature validation fails because the private key format is incorrect

**Problem:**
The `private_key` field in `GCS_CREDENTIALS` contains literal `\n` characters (the two characters: backslash and n), but these need to be converted to actual newline characters for the JWT signature to work.

**Solution:**
Use **base64 encoding** for the entire JSON credentials file. This is the most reliable method and avoids all newline/escaping issues.

**Steps to Fix:**

1. **Generate base64 from your key file:**
   ```bash
   # On Windows PowerShell:
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("key\twiggle-479508-0202d4ba5a07.json"))
   ```

2. **Update in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Find `GCS_CREDENTIALS`
   - Replace the entire value with the base64 string (no quotes needed)
   - Save and redeploy

### 2. NEXTAUTH_URL Uses HTTP Instead of HTTPS

**Current Status:**
- Current: `http://twiggle.co`
- Should be: `https://twiggle.co`

**Problem:**
Using HTTP instead of HTTPS can cause:
- OAuth callback failures
- Security warnings
- Browser blocking of authentication flows

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `NEXTAUTH_URL`
3. Change from `http://twiggle.co` to `https://twiggle.co`
4. Save and redeploy

**Also verify in Google Cloud Console:**
- Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- Click on your OAuth 2.0 Client ID
- Under **Authorized redirect URIs**, ensure you have:
  - `https://twiggle.co/api/auth/callback/google` (not `http://`)
- Click **Save**

## Comparison Summary

| Variable | Local | Vercel | Status |
|----------|-------|--------|--------|
| GCS_BUCKET_NAME | ✓ | ✓ | OK |
| GCS_PROJECT_ID | ✓ | ✓ | OK |
| GCS_CREDENTIALS | 2304 chars | 2334 chars | ⚠️ Format issue |
| GOOGLE_CLIENT_ID | ✓ | ✓ | OK |
| GOOGLE_CLIENT_SECRET | ✓ | ✓ | OK |
| NEXTAUTH_SECRET | ✓ | ✓ | OK |
| NEXTAUTH_URL | ✓ | ⚠️ HTTP | ⚠️ Should be HTTPS |

## Next Steps

1. **Fix GCS_CREDENTIALS:**
   - Generate base64-encoded credentials
   - Update in Vercel environment variables
   - Redeploy

2. **Fix NEXTAUTH_URL:**
   - Change to HTTPS in Vercel
   - Update Google OAuth redirect URI
   - Redeploy

3. **Test:**
   - After redeploying, test creating a new project
   - Test Google OAuth login
   - Check Vercel function logs for any remaining errors

## Files Created

- `.env.vercel` - Contains the pulled environment variables from Vercel (do not commit this file)

