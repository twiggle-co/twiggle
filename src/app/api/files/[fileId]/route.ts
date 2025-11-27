import { NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"
import path from "path"
import fs from "fs"

// Initialize Google Cloud Storage
// Supports both keyFilename and credentials from environment variables
// Falls back to local key file for development if no env vars are set
function getStorage() {
  const config: {
    projectId?: string
    keyFilename?: string
    credentials?: object
  } = {
    projectId: process.env.GCS_PROJECT_ID,
  }

  if (process.env.GCS_KEY_FILENAME) {
    config.keyFilename = process.env.GCS_KEY_FILENAME
    console.log("Using GCS_KEY_FILENAME for authentication")
  } else if (process.env.GCS_CREDENTIALS) {
    try {
      const credentialsString = process.env.GCS_CREDENTIALS
      config.credentials = JSON.parse(credentialsString)
      console.log("Successfully parsed GCS_CREDENTIALS")
      
      // Validate that credentials have required fields
      const creds = config.credentials as any
      if (!creds.type || !creds.project_id || !creds.private_key || !creds.client_email) {
        console.error("GCS_CREDENTIALS is missing required fields")
        throw new Error("GCS_CREDENTIALS is missing required fields")
      }
    } catch (error) {
      console.error("Error parsing GCS_CREDENTIALS:", error)
      throw new Error(`Failed to parse GCS_CREDENTIALS: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  } else {
    // Fallback: Try to use local key file for development
    // Only check for file in development (not on Vercel/build time)
    try {
      const localKeyPath = path.join(process.cwd(), "key", "twiggle-479508-98239b893140.json")
      if (fs.existsSync(localKeyPath)) {
        config.keyFilename = localKeyPath
        console.log("Using local key file for Google Cloud Storage authentication")
      } else {
        console.warn(
          "No GCS credentials configured. Set GCS_KEY_FILENAME, GCS_CREDENTIALS, or place key file at key/twiggle-479508-98239b893140.json"
        )
      }
    } catch (error) {
      // File system operations may fail in serverless environments
      console.warn("Could not check for local key file:", error instanceof Error ? error.message : "Unknown error")
    }
  }

  if (!config.projectId) {
    // Try to get project ID from key file if available
    if (config.keyFilename) {
      try {
        if (fs.existsSync(config.keyFilename)) {
          const keyData = JSON.parse(fs.readFileSync(config.keyFilename, "utf8"))
          config.projectId = keyData.project_id || config.projectId
        }
      } catch (error) {
        // Silently fail - project ID may be set via environment variable
        console.warn("Could not read project ID from key file:", error instanceof Error ? error.message : "Unknown error")
      }
    }
    
    // Try to get project ID from credentials if available
    if (!config.projectId && config.credentials) {
      const creds = config.credentials as any
      config.projectId = creds.project_id
    }
  }

  // Validate that we have some form of authentication
  if (!config.keyFilename && !config.credentials) {
    const errorMsg = "No Google Cloud Storage credentials found. Please set GCS_CREDENTIALS or GCS_KEY_FILENAME environment variable."
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  return new Storage(config)
}

// Lazy initialization to avoid build-time errors on Vercel
let storage: Storage | null = null
function getStorageInstance(): Storage {
  if (!storage) {
    storage = getStorage()
  }
  return storage
}

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "twiggle-files"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    // Get file from bucket
    // Files are stored as {fileId}.{extension}
    const storageInstance = getStorageInstance()
    const bucket = storageInstance.bucket(BUCKET_NAME)
    
    // Try to find the file by listing files with the prefix
    const [files] = await bucket.getFiles({ prefix: fileId })

    if (files.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Get the first matching file (should be unique based on fileId)
    const file = files[0]
    const [exists] = await file.exists()

    if (!exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Get file metadata
    const [metadata] = await file.getMetadata()
    const originalName = metadata.metadata?.originalName || fileId

    // Download file content
    const [buffer] = await file.download()

    // Determine content type
    const contentType = metadata.contentType || "application/octet-stream"

    // Convert Buffer to Uint8Array for NextResponse compatibility
    // This ensures we have a proper ArrayBuffer-like type that NextResponse accepts
    const uint8Array = new Uint8Array(buffer)

    // Return file with appropriate headers
    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${originalName}"`,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error: any) {
    console.error("Error retrieving file:", error)
    
    // Provide helpful error messages for common issues
    let errorMessage = "Failed to retrieve file"
    let statusCode = 500
    
    if (error?.code === 403 || error?.response?.status === 403) {
      errorMessage = "Permission denied: The service account does not have the required permissions to access files from Google Cloud Storage."
      statusCode = 403
    } else if (error?.code === 404 || error?.response?.status === 404) {
      errorMessage = `Bucket "${BUCKET_NAME}" not found. Please check that the bucket exists and the bucket name is correct.`
      statusCode = 404
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: error?.response?.data || error?.message || "Unknown error",
        hint: error?.code === 403
          ? "Ensure the service account has 'Storage Object Viewer' or 'Storage Object Admin' role on the bucket."
          : undefined,
      },
      { status: statusCode }
    )
  }
}

