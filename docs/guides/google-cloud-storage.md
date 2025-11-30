# Google Cloud Storage Setup

## Step 1: Create Bucket

1. Go to [Google Cloud Console](https://console.cloud.google.com/storage)
2. Create a new bucket (e.g., `twiggle-files`)
3. Enable **Uniform bucket-level access**

## Step 2: Create Service Account

1. Go to [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Create new service account
3. Grant **Storage Object Admin** role
4. Create JSON key:
   - Click service account → **Keys** tab
   - **Add Key** > **Create new key** > **JSON**
   - Download the key file

## Step 3: Environment Variables

### Local Development

Add to `.env.local`:

```env
GCS_PROJECT_ID=your-project-id
GCS_KEY_FILENAME=key/your-service-account-key.json
GCS_BUCKET_NAME=your-bucket-name
```

### Production (Vercel)

Add to Vercel environment variables:

1. **GCS_PROJECT_ID**: Your Google Cloud project ID
2. **GCS_BUCKET_NAME**: Your bucket name
3. **GCS_CREDENTIALS**: Base64-encoded JSON key

**Generate base64:**
```bash
# Mac/Linux
cat key/your-service-account-key.json | base64

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("key\your-service-account-key.json"))
```

Paste the entire base64 output as `GCS_CREDENTIALS` value.

**Redeploy** after adding environment variables.
