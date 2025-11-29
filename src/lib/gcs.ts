import { Storage } from "@google-cloud/storage"
import path from "path"

/**
 * Get the bucket name from environment variables
 */
export const BUCKET_NAME =
  process.env.GCS_BUCKET_NAME || "twiggle-files"

/**
 * Get Google Cloud Storage credentials from environment variables
 * Supports:
 * - GCS_CREDENTIALS: JSON string (can be base64-encoded or escaped JSON)
 * - GCS_KEY_FILENAME: Path to service account key file
 * - Fallback to default key file path
 */
function getCredentials(): object | string | undefined {
  // Option 1: Credentials from environment variable (base64 or JSON string)
  if (process.env.GCS_CREDENTIALS) {
    const credsStr = process.env.GCS_CREDENTIALS.trim()

    // Try parsing as base64 first
    try {
      const decoded = Buffer.from(credsStr, "base64").toString("utf8")
      const parsed = JSON.parse(decoded)
      return parsed
    } catch {
      // Not base64, try parsing as JSON string
      try {
        return JSON.parse(credsStr)
      } catch {
        throw new Error(
          "GCS_CREDENTIALS must be valid JSON or base64-encoded JSON"
        )
      }
    }
  }

  // Option 2: Key file path from environment variable
  if (process.env.GCS_KEY_FILENAME) {
    return path.resolve(process.env.GCS_KEY_FILENAME)
  }

  // Option 3: Fallback to default key file path
  const defaultKeyPath = path.resolve("key/twiggle-479508-b9ea5eaacf83.json")
  return defaultKeyPath
}

/**
 * Get or create a Google Cloud Storage instance
 * Uses singleton pattern to avoid creating multiple instances
 */
let storageInstance: Storage | null = null

export function getStorageInstance(): Storage {
  if (storageInstance) {
    return storageInstance
  }

  try {
    const credentials = getCredentials()

    if (!credentials) {
      throw new Error(
        "No Google Cloud Storage credentials found. " +
          "Please set GCS_CREDENTIALS or GCS_KEY_FILENAME environment variable."
      )
    }

    const config: {
      projectId?: string
      keyFilename?: string
      credentials?: object
    } = {}

    // Set project ID if provided
    if (process.env.GCS_PROJECT_ID) {
      config.projectId = process.env.GCS_PROJECT_ID
    }

    // If credentials is a string, it's a file path
    if (typeof credentials === "string") {
      config.keyFilename = credentials
    } else {
      // Otherwise, it's a credentials object
      config.credentials = credentials
      // Extract project_id from credentials if not set
      if (!config.projectId && "project_id" in credentials) {
        config.projectId = (credentials as any).project_id
      }
    }

    storageInstance = new Storage(config)
    return storageInstance
  } catch (error: any) {
    if (error?.message?.includes("No Google Cloud Storage credentials")) {
      throw error
    }
    throw new Error(
      `Failed to initialize Google Cloud Storage: ${error?.message || error}`
    )
  }
}

/**
 * Upload JSON data to Google Cloud Storage
 * @param fileName - The file path/name in the bucket (e.g., "workflows/project-id/uuid.json")
 * @param data - The JSON data to upload
 * @returns The public or signed URL to access the file
 */
export async function uploadJsonToGCS(
  fileName: string,
  data: any
): Promise<string> {
  try {
    const storage = getStorageInstance()
    const bucket = storage.bucket(BUCKET_NAME)

    // Verify bucket exists
    const [bucketExists] = await bucket.exists()
    if (!bucketExists) {
      throw new Error(
        `Bucket "${BUCKET_NAME}" does not exist or is not accessible`
      )
    }

    // Convert data to JSON string and buffer
    const jsonString = JSON.stringify(data, null, 2)
    const buffer = Buffer.from(jsonString, "utf8")

    // Upload file
    const file = bucket.file(fileName)
    await file.save(buffer, {
      metadata: {
        contentType: "application/json",
        metadata: {
          uploadedAt: new Date().toISOString(),
        },
      },
    })

    // Try to make file public, fallback to signed URL if uniform bucket-level access is enabled
    let storageUrl: string
    try {
      await file.makePublic()
      storageUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`
    } catch (makePublicError: any) {
      // If uniform bucket-level access is enabled, use signed URL
      if (
        makePublicError?.code === 400 &&
        makePublicError?.message?.includes("uniform bucket-level access")
      ) {
        const [signedUrl] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        storageUrl = signedUrl
      } else {
        // Fallback to public URL format (bucket might already be public)
        storageUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`
      }
    }

    return storageUrl
  } catch (error: any) {
    console.error("Error uploading JSON to GCS:", error)
    throw error
  }
}

/**
 * Download JSON data from Google Cloud Storage
 * @param storageUrl - The full storage URL (public or signed)
 * @returns The parsed JSON data
 */
export async function downloadJsonFromGCS(storageUrl: string): Promise<any> {
  try {
    const storage = getStorageInstance()
    const bucket = storage.bucket(BUCKET_NAME)

    // Extract file name from URL
    // Handles both public URLs and signed URLs
    let fileName: string
    if (storageUrl.includes(`${BUCKET_NAME}/`)) {
      // Extract from public URL: https://storage.googleapis.com/bucket-name/path/to/file.json
      const match = storageUrl.match(new RegExp(`${BUCKET_NAME}/([^?]+)`))
      if (match) {
        fileName = match[1]
      } else {
        throw new Error(`Invalid storage URL format: ${storageUrl}`)
      }
    } else {
      // For signed URLs, try to extract from query params or use the path
      const url = new URL(storageUrl)
      fileName = url.pathname.replace(`/${BUCKET_NAME}/`, "").replace(/^\//, "")
    }

    if (!fileName) {
      throw new Error(`Could not extract file name from URL: ${storageUrl}`)
    }

    // Get file from bucket
    const file = bucket.file(fileName)
    const [exists] = await file.exists()

    if (!exists) {
      throw new Error(`File not found: ${fileName}`)
    }

    // Download file content
    const [buffer] = await file.download()
    const jsonString = buffer.toString("utf8")
    const data = JSON.parse(jsonString)

    return data
  } catch (error: any) {
    console.error("Error downloading JSON from GCS:", error)
    if (error?.code === 404 || error?.message?.includes("does not exist")) {
      throw new Error(`File not found: ${storageUrl}`)
    }
    throw error
  }
}

