# Google Cloud Storage Setup

This application uses Google Cloud Storage to store uploaded files.

## Quick Start

1. Create a Google Cloud Storage bucket
2. Create a service account with proper permissions
3. Configure environment variables
4. Deploy

## Step 1: Create Google Cloud Storage Bucket

1. Go to [Google Cloud Console](https://console.cloud.google.com/storage)
2. Create a new bucket (e.g., `twiggle-files`)
3. Note the bucket name

### Bucket Access Settings

- **Uniform bucket-level access enabled** (recommended for security):
  - Files will be accessed via signed URLs (valid for 7 days)
  - No additional configuration needed

- **Public access**:
  - Disable uniform bucket-level access, OR
  - Make the entire bucket public at the bucket level
  - Files will be accessible via public URLs

## Step 2: Create Service Account and Grant Permissions

1. Go to [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Create a new service account (or use an existing one)

### Grant IAM Permissions

**Option A: Project-level permissions**
- Click on the service account name
- Go to the "Permissions" tab
- Click "Grant Access"
- Add one of these roles:
  - **Storage Object Admin** (recommended for bucket-level access)
  - **Storage Admin** (full project-level access)

**Option B: Bucket-level permissions**
1. Go to [Cloud Storage > Buckets](https://console.cloud.google.com/storage/browser)
2. Click on your bucket name
3. Go to the "Permissions" tab
4. Click "Grant Access"
5. Add your service account email
6. Select "Storage Object Admin" role

### Create JSON Key

1. Go back to the service account details
2. Click the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" format
5. Download the key file (keep it secure!)

## Step 3: Configure Environment Variables

### Local Development

The app will automatically use the key file at `key/twiggle-479508-cd17df22f76a.json` if no environment variables are set.

Or create a `.env.local` file:

```env
# Option 1: Use service account key file path
GCS_PROJECT_ID=twiggle-479508
GCS_KEY_FILENAME=key/twiggle-479508-cd17df22f76a.json
GCS_BUCKET_NAME=twiggle-files

# Option 2: Use credentials from environment variable
GCS_PROJECT_ID=twiggle-479508
GCS_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
GCS_BUCKET_NAME=twiggle-files
```

### Production (Vercel/Serverless)

**Setting up in Vercel:**

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add the following variables:
   - `GCS_PROJECT_ID`: Your Google Cloud project ID
   - `GCS_CREDENTIALS`: The entire JSON content (see options below)
   - `GCS_BUCKET_NAME`: Your bucket name

4. **For GCS_CREDENTIALS, use one of these methods:**

   **Option A: Base64 Encoding (RECOMMENDED - Most Reliable)**
   
   This avoids all newline/escaping issues:
   ```bash
   # Mac/Linux
   cat key/your-service-account-key.json | base64
   
   # Windows PowerShell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("key\your-service-account-key.json"))
   ```
   
   Copy the entire base64 output and paste it as the value for `GCS_CREDENTIALS` in Vercel.
   
   **Option B: Escaped JSON String**
   
   If not using base64, ensure newlines in `private_key` are escaped as `\\n`:
   - Copy the entire JSON from your service account key file
   - Replace all actual newlines in the `private_key` field with `\\n`
   - Paste as a single-line string
   - Example: `{"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n",...}`

5. Set these for **Production**, **Preview**, and **Development** environments as needed
6. **Redeploy** your application after adding environment variables

⚠️ **Never commit the credentials file to git** (it's already in `.gitignore`)

## Troubleshooting

### Invalid JWT Signature Error

If you see `Error: invalid_grant: Invalid JWT Signature`, this means the `private_key` in `GCS_CREDENTIALS` is malformed.

**Solution:**

1. **Use Base64 Encoding (Recommended):**
   ```bash
   # Generate base64 from your key file
   cat key/your-service-account-key.json | base64
   ```
   Copy the entire output and paste it as `GCS_CREDENTIALS` in Vercel.

2. **Or Fix Escaped JSON:**
   - Ensure all newlines in the `private_key` field are escaped as `\\n`
   - The private key should look like: `"private_key":"-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n"`
   - Verify the key contains both `BEGIN PRIVATE KEY` and `END PRIVATE KEY` markers

3. **After updating:**
   - Save the environment variable in Vercel
   - **Redeploy** your application (environment variables only take effect after redeployment)

### Uploads don't work on Vercel

- Check Vercel function logs for detailed error messages
- Verify all environment variables are set correctly
- **Common issues:**
  - `GCS_CREDENTIALS` must be valid JSON (either base64-encoded or properly escaped)
  - Make sure you copied the entire JSON from your service account key file
  - Environment variables are case-sensitive
  - After adding/changing environment variables, you must **redeploy** your application
- Check the Vercel function logs - the code includes detailed logging to help diagnose issues

### 403 Permission denied error

- Ensure the service account has the correct IAM role:
  - Go to [IAM & Admin > IAM](https://console.cloud.google.com/iam-admin/iam)
  - Find your service account email
  - Verify it has "Storage Object Admin" or "Storage Admin" role
- For bucket-level permissions:
  - Go to your bucket's permissions tab
  - Ensure the service account is listed with "Storage Object Admin" role
- Wait a few minutes after granting permissions (they may take time to propagate)
- Verify the bucket name matches `GCS_BUCKET_NAME` environment variable

### 400 Uniform bucket-level access error

- This is normal! The app automatically handles this by using signed URLs instead of public URLs
- Signed URLs are valid for 7 days and provide secure, time-limited access to files
- No action needed - the upload will succeed and return a signed URL

## File Upload Flow

1. User uploads a file → automatically uploaded to Google Cloud Storage
2. File metadata (name, size, type, storage URL, file ID) is stored in the node
3. User clicks preview → file is retrieved from Google Cloud Storage and displayed in a popout window
4. Files are stored temporarily and can be accessed via the storage URL

## Related Documentation

- [Database Setup](./database-setup.md) - Database configuration
