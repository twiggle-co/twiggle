import { NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"
import { v4 as uuidv4 } from "uuid"
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

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "twiggle-files"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate unique file ID
    const fileId = uuidv4()
    const fileExtension = file.name.split(".").pop() || ""
    const fileName = `${fileId}.${fileExtension}`

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Google Cloud Storage
    const bucket = storage.bucket(BUCKET_NAME)
    const fileUpload = bucket.file(fileName)

    await fileUpload.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      },
    })

    // Try to make the file publicly accessible
    // If uniform bucket-level access is enabled, this will fail and we'll use signed URLs instead
    let storageUrl: string
    try {
      await fileUpload.makePublic()
      // If successful, use public URL
      storageUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`
    } catch (makePublicError: any) {
      // If uniform bucket-level access is enabled, generate a signed URL instead
      if (makePublicError?.code === 400 && makePublicError?.message?.includes("uniform bucket-level access")) {
        console.log("Uniform bucket-level access enabled, using signed URL instead")
        const [signedUrl] = await fileUpload.getSignedUrl({
          action: "read",
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        storageUrl = signedUrl
      } else {
        // For other errors, try to use public URL anyway (bucket might already be public)
        storageUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`
        console.warn("Could not make file public, using public URL (bucket may already be public):", makePublicError?.message)
      }
    }

    return NextResponse.json({
      fileId,
      fileName: file.name,
      size: file.size,
      type: file.type,
      storageUrl,
    })
  } catch (error: any) {
    console.error("Error uploading file:", error)
    
    // Provide helpful error messages for common issues
    let errorMessage = "Failed to upload file"
    let statusCode = 500
    
    if (error?.code === 403 || error?.response?.status === 403) {
      errorMessage = "Permission denied: The service account does not have the required permissions to upload files to Google Cloud Storage."
      statusCode = 403
    } else if (error?.code === 404 || error?.response?.status === 404) {
      errorMessage = `Bucket "${BUCKET_NAME}" not found. Please check that the bucket exists and the bucket name is correct.`
      statusCode = 404
    } else if (error?.code === 400 && error?.message?.includes("uniform bucket-level access")) {
      errorMessage = "Uniform bucket-level access is enabled. Files will be accessed via signed URLs."
      statusCode = 400
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: error?.response?.data || error?.message || "Unknown error",
        hint: error?.code === 403
          ? "Ensure the service account has 'Storage Object Admin' or 'Storage Admin' role on the bucket."
          : undefined,
      },
      { status: statusCode }
    )
  }
}

