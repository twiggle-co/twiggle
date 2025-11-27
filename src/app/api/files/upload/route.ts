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

  // Log environment variable status (without exposing sensitive data)
  console.log("GCS Configuration Check:")
  console.log("- GCS_PROJECT_ID:", process.env.GCS_PROJECT_ID ? "✓ Set" : "✗ Not set")
  console.log("- GCS_KEY_FILENAME:", process.env.GCS_KEY_FILENAME ? "✓ Set" : "✗ Not set")
  console.log("- GCS_CREDENTIALS:", process.env.GCS_CREDENTIALS ? `✓ Set (${process.env.GCS_CREDENTIALS.length} chars)` : "✗ Not set")
  console.log("- GCS_BUCKET_NAME:", process.env.GCS_BUCKET_NAME || "Using default: twiggle-files")

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
        console.error("GCS_CREDENTIALS is missing required fields:", {
          hasType: !!creds.type,
          hasProjectId: !!creds.project_id,
          hasPrivateKey: !!creds.private_key,
          hasClientEmail: !!creds.client_email,
        })
        throw new Error("GCS_CREDENTIALS is missing required fields")
      }
      console.log("GCS credentials validated successfully")
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

  console.log("Creating Storage instance with config:", {
    projectId: config.projectId,
    hasKeyFilename: !!config.keyFilename,
    hasCredentials: !!config.credentials,
  })

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
    console.log(`Attempting to upload file: ${fileName} to bucket: ${BUCKET_NAME}`)
    const storageInstance = getStorageInstance()
    const bucket = storageInstance.bucket(BUCKET_NAME)
    
    // Verify bucket exists and is accessible
    const [bucketExists] = await bucket.exists()
    if (!bucketExists) {
      throw new Error(`Bucket "${BUCKET_NAME}" does not exist or is not accessible`)
    }
    console.log(`Bucket "${BUCKET_NAME}" verified`)
    
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
    console.error("Error details:", {
      code: error?.code,
      message: error?.message,
      status: error?.response?.status,
      response: error?.response?.data,
    })
    
    // Provide helpful error messages for common issues
    let errorMessage = "Failed to upload file"
    let statusCode = 500
    
    if (error?.message?.includes("No Google Cloud Storage credentials")) {
      errorMessage = "Google Cloud Storage credentials are not configured. Please set GCS_CREDENTIALS environment variable in Vercel."
      statusCode = 500
    } else if (error?.code === 403 || error?.response?.status === 403) {
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
          : error?.message?.includes("No Google Cloud Storage credentials")
          ? "Set GCS_CREDENTIALS environment variable in Vercel with your service account JSON credentials."
          : undefined,
      },
      { status: statusCode }
    )
  }
}

