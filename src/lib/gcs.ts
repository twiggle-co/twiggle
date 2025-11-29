import { Storage } from "@google-cloud/storage"
import path from "path"

/**
 * Strip surrounding quotes from environment variable values
 * Handles cases where Vercel or other platforms wrap values in quotes
 */
function stripQuotes(value: string | undefined): string | undefined {
  if (!value) return value
  let trimmed = value.trim()
  
  // Remove surrounding double quotes or single quotes (handle multiple layers)
  while (
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
     (trimmed.startsWith("'") && trimmed.endsWith("'"))) &&
    trimmed.length >= 2
  ) {
    trimmed = trimmed.slice(1, -1).trim()
  }
  
  return trimmed
}

/**
 * Get the bucket name from environment variables
 * Strips quotes if present (common in Vercel)
 */
export const BUCKET_NAME =
  stripQuotes(process.env.GCS_BUCKET_NAME) || "twiggle-files"

/**
 * Get Google Cloud Storage credentials from environment variables
 * Supports:
 * - GCS_CREDENTIALS: JSON string (can be base64-encoded or escaped JSON)
 * - GCS_KEY_FILENAME: Path to service account key file
 * - Fallback to default key file path
 */
function getCredentials(): object | string | undefined {
  // Option 1: Credentials from environment variable (base64 or JSON string)
  const credentialsEnv = stripQuotes(process.env.GCS_CREDENTIALS)
  if (credentialsEnv) {
    const credsStr = credentialsEnv.trim()

    // Try parsing as base64 first
    try {
      const decoded = Buffer.from(credsStr, "base64").toString("utf8")
      const parsed = JSON.parse(decoded)
      return parsed
    } catch (base64Error) {
      // Not base64, try parsing as JSON string
      try {
        return JSON.parse(credsStr)
      } catch (jsonError) {
        const errorMessage = `GCS_CREDENTIALS must be valid JSON or base64-encoded JSON. ` +
          `JSON parse error: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}. ` +
          `First 100 chars of credentials: ${credsStr.substring(0, 100)}`
        throw new Error(errorMessage)
      }
    }
  }

  // Option 2: Key file path from environment variable
  const keyFilename = stripQuotes(process.env.GCS_KEY_FILENAME)
  if (keyFilename) {
    return path.resolve(keyFilename)
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

    // Set project ID if provided (strip quotes if present)
    const projectId = stripQuotes(process.env.GCS_PROJECT_ID)
    if (projectId) {
      config.projectId = projectId
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
    
    // Check for OpenSSL decoder errors (Node.js 17+ compatibility issue)
    if (
      error?.code === "ERR_OSSL_UNSUPPORTED" ||
      error?.message?.includes("DECODER routines") ||
      error?.message?.includes("1E08010C") ||
      error?.message?.includes("0308010C")
    ) {
      throw new Error(
        "OpenSSL compatibility error: Node.js 17+ requires the legacy OpenSSL provider. " +
        "Please set NODE_OPTIONS=--openssl-legacy-provider in your Vercel environment variables. " +
        "Go to: Vercel Dashboard → Your Project → Settings → Environment Variables → Add NODE_OPTIONS with value '--openssl-legacy-provider'. " +
        "Then redeploy your application. " +
        `Original error: ${error?.message || String(error)}`
      )
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
    
    // Check for OpenSSL decoder errors (Node.js 17+ compatibility issue)
    if (
      error?.code === "ERR_OSSL_UNSUPPORTED" ||
      error?.message?.includes("DECODER routines") ||
      error?.message?.includes("1E08010C") ||
      error?.message?.includes("0308010C")
    ) {
      throw new Error(
        "OpenSSL compatibility error: Node.js 17+ requires the legacy OpenSSL provider. " +
        "Please set NODE_OPTIONS=--openssl-legacy-provider in your Vercel environment variables. " +
        "Go to: Vercel Dashboard → Your Project → Settings → Environment Variables → Add NODE_OPTIONS with value '--openssl-legacy-provider'. " +
        "Then redeploy your application. " +
        `Original error: ${error?.message || String(error)}`
      )
    }
    
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

