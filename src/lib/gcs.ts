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
 * Check if error is a cryptographic/SSL related issue
 */
function isCryptographicError(error: unknown): boolean {
  const err = error as any
  return (
    err?.code === "ERR_OSSL_UNSUPPORTED" ||
    err?.message?.includes("DECODER routines") ||
    err?.message?.includes("crypto") ||
    err?.message?.includes("sign")
  )
}

/**
 * Get cryptographic error message
 */
function getCryptographicErrorMessage(originalError: unknown): string {
  const err = originalError as any
  return (
    "Cryptographic operation failed. This may indicate a compatibility issue with the cryptographic library. " +
    "Please ensure you're using the latest version of @google-cloud/storage. " +
    `Original error: ${err?.message || String(originalError)}`
  )
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
      return JSON.parse(decoded)
    } catch {
      // Not base64, try parsing as JSON string
      try {
        return JSON.parse(credsStr)
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
    if (isCryptographicError(error)) {
      throw new Error(getCryptographicErrorMessage(error))
    }
    
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
    
    if (isCryptographicError(error)) {
      throw new Error(getCryptographicErrorMessage(error))
    }
    
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
