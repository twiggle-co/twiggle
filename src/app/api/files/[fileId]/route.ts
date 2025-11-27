import { NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"

// Initialize Google Cloud Storage
// Supports both keyFilename and credentials from environment variables
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
  }

  return new Storage(config)
}

const storage = getStorage()

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
  } catch (error) {
    console.error("Error retrieving file:", error)
    return NextResponse.json(
      { error: "Failed to retrieve file", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

