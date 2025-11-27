# twiggle
main site code

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Google Cloud Storage Setup

This application uses Google Cloud Storage to temporarily store uploaded files. To configure:

1. **Create a Google Cloud Storage bucket:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/storage)
   - Create a new bucket (e.g., `twiggle-files`)
   - Note the bucket name
   - **Bucket Access Settings:**
     - If **Uniform bucket-level access** is enabled (recommended for security):
       - Files will be accessed via signed URLs (valid for 7 days)
       - No additional configuration needed
     - If you want public access:
       - Disable uniform bucket-level access, OR
       - Make the entire bucket public at the bucket level
       - Files will be accessible via public URLs

2. **Create a Service Account and Grant Permissions:**
   - Go to [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
   - Create a new service account (or use an existing one)
   - **Grant IAM Permissions:**
     - Click on the service account name
     - Go to the "Permissions" tab
     - Click "Grant Access"
     - Add one of these roles:
       - **Storage Object Admin** (recommended for bucket-level access)
       - **Storage Admin** (full project-level access)
     - For bucket-level access only:
       - In the "Condition" section, you can restrict to a specific bucket
       - Or grant the role at the bucket level:
         1. Go to [Cloud Storage > Buckets](https://console.cloud.google.com/storage/browser)
         2. Click on your bucket name
         3. Go to the "Permissions" tab
         4. Click "Grant Access"
         5. Add your service account email
         6. Select "Storage Object Admin" role
   - **Create a JSON Key:**
     - Go back to the service account details
     - Click the "Keys" tab
     - Click "Add Key" > "Create new key"
     - Select "JSON" format
     - Download the key file (keep it secure!)

3. **Configure Environment Variables:**
   
   **For Local Development:**
   - The app will automatically use the key file at `key/twiggle-479508-98239b893140.json` if no environment variables are set
   - Or create a `.env.local` file in the root directory with:

   ```env
   # Option 1: Use service account key file path
   GCS_PROJECT_ID=twiggle-479508
   GCS_KEY_FILENAME=key/twiggle-479508-98239b893140.json
   GCS_BUCKET_NAME=twiggle-files

   # Option 2: Use credentials from environment variable (for serverless/Vercel)
   # GCS_PROJECT_ID=twiggle-479508
   # GCS_CREDENTIALS={"type":"service_account","project_id":"twiggle-479508","private_key":"...","client_email":"..."}
   # GCS_BUCKET_NAME=twiggle-files
   ```

   **For Production (Vercel/Serverless):**
   - Use Option 2 with `GCS_CREDENTIALS` environment variable
   - **Setting up in Vercel:**
     1. Go to your Vercel project dashboard
     2. Navigate to **Settings** > **Environment Variables**
     3. Add the following variables:
        - `GCS_PROJECT_ID`: Your Google Cloud project ID (e.g., `twiggle-479508`)
        - `GCS_CREDENTIALS`: The entire JSON content of your service account key file as a single-line string
        - `GCS_BUCKET_NAME`: Your bucket name (e.g., `twiggle-files`)
     4. **Important for GCS_CREDENTIALS:**
        - Copy the entire JSON from your service account key file
        - Paste it as a single-line string (remove all line breaks)
        - Or use a JSON minifier to convert it to one line
        - Example format: `{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}`
     5. Make sure to set these for **Production**, **Preview**, and **Development** environments as needed
     6. **Redeploy** your application after adding environment variables
   - Never commit the credentials file to git (it's already in `.gitignore`)

4. **Troubleshooting Errors:**
   
   **If uploads don't work on Vercel:**
   - Check Vercel function logs for detailed error messages
   - Verify all environment variables are set correctly:
     - `GCS_PROJECT_ID` should be your project ID
     - `GCS_CREDENTIALS` should be the entire JSON as a single-line string
     - `GCS_BUCKET_NAME` should match your bucket name
   - **Common issues:**
     - `GCS_CREDENTIALS` must be a valid JSON string (single line, no line breaks)
     - Make sure you copied the entire JSON from your service account key file
     - Environment variables are case-sensitive
     - After adding/changing environment variables, you must **redeploy** your application
   - Check the Vercel function logs - the code now includes detailed logging to help diagnose issues
   
   **If you see a `403 Permission denied` error:**
   - Ensure the service account has the correct IAM role:
     - Go to [IAM & Admin > IAM](https://console.cloud.google.com/iam-admin/iam)
     - Find your service account email (e.g., `twiggle@twiggle-479508.iam.gserviceaccount.com`)
     - Verify it has "Storage Object Admin" or "Storage Admin" role
   - For bucket-level permissions:
     - Go to your bucket's permissions tab
     - Ensure the service account is listed with "Storage Object Admin" role
   - Wait a few minutes after granting permissions (they may take time to propagate)
   - Verify the bucket name matches `GCS_BUCKET_NAME` environment variable
   
   **If you see a `400 Uniform bucket-level access` error:**
   - This is normal! The app automatically handles this by using signed URLs instead of public URLs
   - Signed URLs are valid for 7 days and provide secure, time-limited access to files
   - No action needed - the upload will succeed and return a signed URL

5. **Install Dependencies:**
   ```bash
   npm install
   ```

## File Upload Flow

1. When a user uploads a file, it's automatically uploaded to Google Cloud Storage
2. The file metadata (name, size, type, storage URL, file ID) is stored in the node
3. When the user clicks preview, the file is retrieved from Google Cloud Storage and displayed in a popout window
4. Files are stored temporarily and can be accessed via the storage URL

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
