# Twiggle Frontend

Main site code for the Twiggle application.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Features

- **File Upload & Storage**: Upload files to Google Cloud Storage
- **User Authentication**: Google OAuth login via NextAuth.js
- **Canvas Interface**: Interactive node-based canvas for workflow management
- **File Preview**: Preview uploaded files in popout windows

## Documentation

Detailed setup guides are available in the [`/docs`](./docs) directory:

- [Google Cloud Storage Setup](./docs/setup/google-cloud-storage.md)
- [Google Authentication Setup](./docs/setup/google-auth.md)
- [GitHub Setup](./docs/setup/github.md)

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Canvas**: [React Flow](https://xyflow.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Storage**: Google Cloud Storage
- **Deployment**: Vercel

## Project Structure

```
twiggle-frontend/
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   ├── components/        # React components
│   └── lib/              # Utility functions
├── docs/                 # Documentation
├── public/              # Static assets
└── key/                 # Local credentials (gitignored)
```

## Environment Variables

Required environment variables (see [setup guides](./docs) for details):

- `GCS_PROJECT_ID` - Google Cloud project ID
- `GCS_CREDENTIALS` or `GCS_KEY_FILENAME` - Google Cloud Storage credentials
- `GCS_BUCKET_NAME` - Google Cloud Storage bucket name
- `NEXTAUTH_URL` - NextAuth.js base URL
- `NEXTAUTH_SECRET` - NextAuth.js secret key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

Create a `.env.local` file for local development.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Flow Documentation](https://xyflow.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)

## License

Private project - All rights reserved
