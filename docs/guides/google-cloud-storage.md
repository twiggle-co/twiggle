# Google Cloud Storage Setup

This guide explains how to set up Google Cloud Storage (GCS) for file storage in Twiggle.

## What You'll Need

- A Google Cloud Platform account
- A Google Cloud project
- About 15 minutes

## Overview

Twiggle uses Google Cloud Storage to:
- Store uploaded files
- Store workflow data
- Serve files securely

## Step 1: Create a Storage Bucket

### 1.1 Go to Cloud Storage

1. Visit [Google Cloud Console](https://console.cloud.google.com/storage)
2. Select your project

### 1.2 Create Bucket

1. Click **Create Bucket**
2. Choose a name (e.g., `twiggle-files`)
   - Bucket names must be globally unique
   - Use lowercase letters, numbers, and hyphens
3. Select a location (choose closest to your users)
4. Choose **Uniform** for access control
5. Click **Create**

### 1.3 Enable Uniform Bucket-Level Access

1. Click on your bucket
2. Go to **Permissions** tab
3. Click **Edit** on "Uniform bucket-level access"
4. Enable it
5. Save

## Step 2: Create a Service Account

### 2.1 Create Service Account

1. Go to [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Click **Create Service Account**
3. Fill in:
   - **Name:** `twiggle-storage` (or any name)
   - **Description:** "Service account for Twiggle file storage"
4. Click **Create and Continue**

### 2.2 Grant Permissions

1. In "Grant this service account access to project"
2. Select role: **Storage Object Admin**
   - This allows read/write/delete access to objects
3. Click **Continue** > **Done**

### 2.3 Create JSON Key

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** > **Create new key**
4. Choose **JSON**
5. Click **Create**
6. **Download the JSON file** - you'll need this!

## Step 3: Configure Environment Variables

### For Local Development

1. Place the downloaded JSON key file in the `key/` directory:
   ```
   key/your-service-account-key.json
   ```

2. Add to `.env.local`:
   ```env
   # Google Cloud Storage
   GCS_PROJECT_ID="your-project-id"
   GCS_BUCKET_NAME="twiggle-files"
   GCS_KEY_FILENAME="key/your-service-account-key.json"
   ```

   **Find your Project ID:**
   - It's shown in the Google Cloud Console header
   - Or in the JSON key file you downloaded (the `project_id` field)

### For Production (Vercel)

Instead of using a file, you'll use base64-encoded credentials:

1. **Encode your JSON key:**
   
   **Mac/Linux:**
   ```bash
   cat key/your-service-account-key.json | base64
   ```
   
   **Windows PowerShell:**
   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("key\your-service-account-key.json"))
   ```

2. **Add to Vercel environment variables:**
   - `GCS_PROJECT_ID` = Your project ID
   - `GCS_BUCKET_NAME` = Your bucket name
   - `GCS_CREDENTIALS` = The base64 string from step 1

3. **Redeploy** your application

## Step 4: Test It

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Try uploading a file in the app
3. Check your Google Cloud Storage bucket - the file should appear there!

## How It Works

1. **File Upload:**
   - User uploads a file through the Twiggle interface
   - File is sent to `/api/files/upload`
   - API route uploads file to GCS bucket
   - Returns a public URL or signed URL

2. **File Access:**
   - Files are accessed via URLs
   - Public files: Direct URL to GCS
   - Private files: Signed URLs (expire after 7 days)

3. **File Storage:**
   - Files are organized by project: `workflows/{projectId}/files/{fileId}`
   - Workflow data: `workflows/{projectId}/{workflowId}.json`

## Troubleshooting

### "Bucket does not exist"

**Problem:** The bucket name in `GCS_BUCKET_NAME` doesn't match an existing bucket.

**Solution:**
- Check the bucket name in Google Cloud Console
- Make sure it matches exactly (case-sensitive)

### "Permission denied"

**Problem:** Service account doesn't have the right permissions.

**Solution:**
- Go to IAM & Admin > Service Accounts
- Edit your service account
- Make sure it has **Storage Object Admin** role

### "Invalid credentials"

**Problem:** The JSON key file is incorrect or corrupted.

**Solution:**
- Download a new key from Google Cloud Console
- Make sure the file path in `GCS_KEY_FILENAME` is correct
- For production, regenerate the base64-encoded credentials

### "File not found" when accessing files

**Problem:** File was deleted or path is incorrect.

**Solution:**
- Check the bucket in Google Cloud Console
- Verify the file path matches what's stored in the database
- Check file permissions (should be public or have signed URL)

## Security Best Practices

1. **Never commit keys** - The `key/` directory is in `.gitignore`
2. **Use service accounts** - Don't use your personal Google account
3. **Limit permissions** - Only grant necessary roles (Storage Object Admin)
4. **Rotate keys** - Regenerate keys periodically or if compromised
5. **Use signed URLs** - For private files, use signed URLs that expire

## File Organization

Files are stored with this structure:

```
your-bucket/
├── workflows/
│   ├── {projectId}/
│   │   ├── files/
│   │   │   ├── {fileId}.pdf
│   │   │   ├── {fileId}.jpg
│   │   │   └── ...
│   │   └── {workflowId}.json
```

## Cost Considerations

Google Cloud Storage pricing:
- **Storage:** ~$0.020 per GB/month
- **Operations:** Very cheap (fractions of a cent per 1,000 operations)
- **Network egress:** Free up to 1 GB/day, then ~$0.12 per GB

For most applications, costs are minimal. Monitor usage in Google Cloud Console.

## Next Steps

- ✅ Google Cloud Storage is configured
- 🔐 Set up [Google Authentication](./google-auth.md) if not done
- 🗄️ Review [Database Setup](./database-setup.md) if needed
