import { NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"

// Initialize Google Cloud Storage client using environment variables
function getStorageInstance(): Storage {
  const config: {
    projectId?: string
    keyFilename?: string
    credentials?: object
  } = {
    projectId: process.env.GCS_PROJECT_ID,
  }

  // Option 1: Use key file path from environment variable
  if (process.env.GCS_KEY_FILENAME) {
    config.keyFilename = process.env.GCS_KEY_FILENAME
    console.log("Using GCS_KEY_FILENAME for authentication")
    return new Storage(config)
  }

  // Option 2: Use credentials JSON from environment variable
  if (process.env.GCS_CREDENTIALS) {
    let credentialsString = process.env.GCS_CREDENTIALS.trim()

    // Try parsing as JSON first
    let parsedCredentials: any = null
    try {
      parsedCredentials = JSON.parse(credentialsString)
    } catch (parseError) {
      // If direct parse fails, try base64 decode
      try {
        const decoded = Buffer.from(credentialsString, "base64").toString("utf8")
        if (decoded.trim().startsWith("{")) {
          parsedCredentials = JSON.parse(decoded.trim())
        } else {
          throw parseError
        }
      } catch (base64Error) {
        // Replace escaped newlines and try again
        credentialsString = credentialsString.replace(/\\n/g, "\n")
        try {
          parsedCredentials = JSON.parse(credentialsString)
        } catch (finalError) {
          const errorMsg = parseError instanceof Error ? parseError.message : "Unknown error"
          throw new Error(
            `Failed to parse GCS_CREDENTIALS: ${errorMsg}. ` +
            `Ensure GCS_CREDENTIALS in .env.local is valid JSON. ` +
            `For multi-line JSON, escape newlines as \\n or use base64 encoding.`
          )
        }
      }
    }

    // Validate required fields
    if (
      !parsedCredentials.type ||
      !parsedCredentials.project_id ||
      !parsedCredentials.private_key ||
      !parsedCredentials.client_email
    ) {
      throw new Error(
        "GCS_CREDENTIALS is missing required fields. " +
        "Ensure it contains: type, project_id, private_key, and client_email."
      )
    }

    config.credentials = parsedCredentials
    
    // Use project_id from credentials if not set separately
    if (!config.projectId && parsedCredentials.project_id) {
      config.projectId = parsedCredentials.project_id
    }

    console.log("Using GCS_CREDENTIALS for authentication")
    return new Storage(config)
  }

  // No credentials found
  throw new Error(
    "No Google Cloud Storage credentials found. " +
    "Please set either GCS_KEY_FILENAME or GCS_CREDENTIALS in your .env.local file."
  )
}

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "twiggle-files"

export async function GET(
  _request: NextRequest,
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

