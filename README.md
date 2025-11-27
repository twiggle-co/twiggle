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

2. **Create a Service Account:**
   - Go to [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
   - Create a new service account
   - Grant it "Storage Object Admin" role for the bucket
   - Create a JSON key and download it

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory with:

   ```env
   # Option 1: Use service account key file
   GCS_PROJECT_ID=your-project-id
   GCS_KEY_FILENAME=path/to/service-account-key.json
   GCS_BUCKET_NAME=twiggle-files

   # Option 2: Use credentials from environment variable (for serverless)
   # GCS_PROJECT_ID=your-project-id
   # GCS_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
   # GCS_BUCKET_NAME=twiggle-files
   ```

4. **Install Dependencies:**
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
