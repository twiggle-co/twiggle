import { Storage } from "@google-cloud/storage"
import type { File, Bucket } from "@google-cloud/storage"
import path from "path"
import { stripQuotes } from "./env"

/**
 * Google Cloud Storage configuration
 */
export const BUCKET_NAME = stripQuotes(process.env.GCS_BUCKET_NAME) || "twiggle-files"

const SIGNED_URL_EXPIRY_DAYS = 7
const SIGNED_URL_EXPIRY_MS = SIGNED_URL_EXPIRY_DAYS * 24 * 60 * 60 * 1000

/**
 * Normalize private key format for OpenSSL 3.0 compatibility
 * Handles various encoding issues that can cause JWT signature errors
 */
function normalizePrivateKey(credentials: any): any {
  if (credentials && typeof credentials === "object" && credentials.private_key) {
    let privateKey = credentials.private_key

    // Replace escaped newlines with actual newlines (handle both \\n and \n)
    privateKey = privateKey.replace(/\\n/g, "\n")
    
    // Remove any trailing/leading whitespace but preserve internal structure
    privateKey = privateKey.trim()
    
    // Ensure the key has proper BEGIN/END markers with newlines
    if (!privateKey.includes("\n")) {
      // If no newlines at all, try to add them around the key content
      // This handles cases where the entire key is on one line
      privateKey = privateKey.replace(
        /(-----BEGIN PRIVATE KEY-----)(.*?)(-----END PRIVATE KEY-----)/,
        "$1\n$2\n$3"
      )
    }
    
    // Ensure proper formatting: BEGIN marker should be on its own line
    if (!privateKey.startsWith("-----BEGIN")) {
      // Find where the key actually starts
      const beginIndex = privateKey.indexOf("-----BEGIN")
      if (beginIndex > 0) {
        privateKey = privateKey.substring(beginIndex)
      }
    }
    
    // Ensure proper formatting: END marker should be on its own line
    if (!privateKey.endsWith("-----")) {
      // Find where the key actually ends
      const endIndex = privateKey.lastIndexOf("-----END")
      if (endIndex > 0) {
        privateKey = privateKey.substring(0, endIndex + "-----END PRIVATE KEY-----".length)
      }
    }
    
    credentials.private_key = privateKey
  }
  return credentials
}

/**
 * Get Google Cloud Storage credentials from environment variables
 * Supports:
 * - GCS_CREDENTIALS: JSON string (can be base64-encoded or escaped JSON)
 * - GCS_KEY_FILENAME: Path to service account key file
 * - Fallback to default key file path
 */
function getCredentials(): object | string {
  // Option 1: Credentials from environment variable
  const credentialsEnv = stripQuotes(process.env.GCS_CREDENTIALS)
  if (credentialsEnv) {
    const credsStr = credentialsEnv.trim()

    // Try parsing as base64 first
    try {
      const decoded = Buffer.from(credsStr, "base64").toString("utf8")
      const credentials = JSON.parse(decoded)
      return normalizePrivateKey(credentials)
    } catch {
      // Not base64, try parsing as JSON string
      try {
        const credentials = JSON.parse(credsStr)
        return normalizePrivateKey(credentials)
      } catch (jsonError) {
        const error = jsonError instanceof Error ? jsonError : new Error(String(jsonError))
        throw new Error(
          `GCS_CREDENTIALS must be valid JSON or base64-encoded JSON. ` +
          `JSON parse error: ${error.message}. ` +
          `First 100 chars: ${credsStr.substring(0, 100)}`
        )
      }
    }
  }

  // Option 2: Key file path from environment variable
  const keyFilename = stripQuotes(process.env.GCS_KEY_FILENAME)
  if (keyFilename) {
    return path.resolve(keyFilename)
  }

  // Option 3: Fallback to default key file path
  return path.resolve("key/twiggle-479508-b9ea5eaacf83.json")
}

/**
 * Get or create a Google Cloud Storage instance (singleton)
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
    const projectId = stripQuotes(process.env.GCS_PROJECT_ID)
    if (projectId) {
      config.projectId = projectId
    }

    // Configure credentials
    if (typeof credentials === "string") {
      config.keyFilename = credentials
    } else {
      config.credentials = credentials
      // Extract project_id from credentials if not set
      if (!config.projectId && "project_id" in credentials) {
        config.projectId = (credentials as any).project_id
      }
    }

    storageInstance = new Storage(config)
    return storageInstance
  } catch (error) {
    const err = error as Error
    throw new Error(
      `Failed to initialize Google Cloud Storage: ${err.message || String(error)}`
    )
  }
}

/**
 * Get file URL (public or signed)
 * Uses V4 signing for OpenSSL 3.0 compatibility
 */
async function getFileUrl(fileName: string, file: File): Promise<string> {
  try {
    await file.makePublic()
    return `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`
  } catch (makePublicError: any) {
    // If uniform bucket-level access is enabled, use V4 signed URL (OpenSSL 3.0 compatible)
    if (
      makePublicError?.code === 400 &&
      makePublicError?.message?.includes("uniform bucket-level access")
    ) {
      const [signedUrl] = await file.getSignedUrl({
        version: "v4", // Use V4 signing for OpenSSL 3.0 compatibility
        action: "read",
        expires: Date.now() + SIGNED_URL_EXPIRY_MS,
      })
      return signedUrl
    }
    // Fallback to public URL format
    return `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`
  }
}

/**
 * Verify bucket exists and is accessible
 */
async function verifyBucket(bucket: Bucket): Promise<void> {
  const [bucketExists] = await bucket.exists()
  if (!bucketExists) {
    throw new Error(
      `Bucket "${BUCKET_NAME}" does not exist or is not accessible`
    )
  }
}

/**
 * Upload JSON data to Google Cloud Storage
 */
export async function uploadJsonToGCS(
  fileName: string,
  data: unknown
): Promise<string> {
  try {
    const storage = getStorageInstance()
    const bucket = storage.bucket(BUCKET_NAME)

    await verifyBucket(bucket)

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

    return getFileUrl(fileName, file)
  } catch (error) {
    console.error("Error uploading JSON to GCS:", error)
    throw error
  }
}

/**
 * Extract file name from storage URL
 */
function extractFileNameFromUrl(storageUrl: string): string {
  // Handle public URLs: https://storage.googleapis.com/bucket-name/path/to/file.json
  if (storageUrl.includes(`${BUCKET_NAME}/`)) {
    const match = storageUrl.match(new RegExp(`${BUCKET_NAME}/([^?]+)`))
    if (match) {
      return match[1]
    }
  }

  // Handle signed URLs
  try {
    const url = new URL(storageUrl)
    return url.pathname.replace(`/${BUCKET_NAME}/`, "").replace(/^\//, "")
  } catch {
    // Invalid URL format
  }

  throw new Error(`Invalid storage URL format: ${storageUrl}`)
}

/**
 * Download JSON data from Google Cloud Storage
 */
export async function downloadJsonFromGCS(storageUrl: string): Promise<unknown> {
  try {
    const storage = getStorageInstance()
    const bucket = storage.bucket(BUCKET_NAME)

    const fileName = extractFileNameFromUrl(storageUrl)
    const file = bucket.file(fileName)

    // Verify file exists
    const [exists] = await file.exists()
    if (!exists) {
      throw new Error(`File not found: ${fileName}`)
    }

    // Download and parse JSON
    const [buffer] = await file.download()
    const jsonString = buffer.toString("utf8")
    return JSON.parse(jsonString)
  } catch (error) {
    console.error("Error downloading JSON from GCS:", error)
    
    const err = error as any
    if (err?.code === 404 || err?.message?.includes("does not exist")) {
      throw new Error(`File not found: ${storageUrl}`)
    }
    
    throw error
  }
}
