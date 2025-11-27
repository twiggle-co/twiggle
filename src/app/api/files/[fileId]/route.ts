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
  } else if (process.env.GCS_CREDENTIALS) {
    try {
      config.credentials = JSON.parse(process.env.GCS_CREDENTIALS)
    } catch (error) {
      console.error("Error parsing GCS_CREDENTIALS:", error)
    }
  } else {
    // Fallback: Try to use local key file for development
    const localKeyPath = path.join(process.cwd(), "key", "twiggle-479508-98239b893140.json")
    if (fs.existsSync(localKeyPath)) {
      config.keyFilename = localKeyPath
      console.log("Using local key file for Google Cloud Storage authentication")
    } else {
      console.warn(
        "No GCS credentials configured. Set GCS_KEY_FILENAME, GCS_CREDENTIALS, or place key file at key/twiggle-479508-98239b893140.json"
      )
    }
  }

  if (!config.projectId) {
    // Try to get project ID from key file if available
    if (config.keyFilename && fs.existsSync(config.keyFilename)) {
      try {
        const keyData = JSON.parse(fs.readFileSync(config.keyFilename, "utf8"))
        config.projectId = keyData.project_id || config.projectId
      } catch (error) {
        console.error("Error reading project ID from key file:", error)
      }
    }
  }

  return new Storage(config)
}

const storage = getStorage()

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "twiggle-files" || "twiggle-files"

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
    const bucket = storage.bucket(BUCKET_NAME)
    
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

    // Return file with appropriate headers
    return new NextResponse(buffer, {
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

