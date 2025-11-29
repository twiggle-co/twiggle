import { Storage } from "@google-cloud/storage"

// Initialize Google Cloud Storage client using environment variables
export function getStorageInstance(): Storage {
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

    return new Storage(config)
  }

  // No credentials found
  throw new Error(
    "No Google Cloud Storage credentials found. " +
    "Please set either GCS_KEY_FILENAME or GCS_CREDENTIALS in your .env.local file."
  )
}

// Get bucket name from environment variable (required)
const BUCKET_NAME_ENV = process.env.GCS_BUCKET_NAME
if (!BUCKET_NAME_ENV) {
  throw new Error(
    "GCS_BUCKET_NAME environment variable is required. " +
    "Please set GCS_BUCKET_NAME in your .env.local file."
  )
}
export const BUCKET_NAME: string = BUCKET_NAME_ENV

/**
 * Upload JSON data to Google Cloud Storage
 */
export async function uploadJsonToGCS(
  fileName: string,
  jsonData: any,
  contentType: string = "application/json"
): Promise<string> {
  const storage = getStorageInstance()
  const bucket = storage.bucket(BUCKET_NAME)

  // Verify bucket exists
  const [bucketExists] = await bucket.exists()
  if (!bucketExists) {
    throw new Error(`Bucket "${BUCKET_NAME}" does not exist or is not accessible`)
  }

  const file = bucket.file(fileName)
  const jsonString = JSON.stringify(jsonData, null, 2)
  const buffer = Buffer.from(jsonString, "utf8")

  await file.save(buffer, {
    metadata: {
      contentType,
      metadata: {
        uploadedAt: new Date().toISOString(),
      },
    },
  })

  // Get storage URL (try public first, fallback to signed URL)
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
}

/**
 * Download and parse JSON from Google Cloud Storage
 */
export async function downloadJsonFromGCS(storageUrl: string): Promise<any> {
  const storage = getStorageInstance()
  
  // Extract bucket name and file path from URL
  // Handle both public URLs and signed URLs (which have query parameters)
  let fileName: string
  
  try {
    // Use URL parsing to properly handle query parameters
    const url = new URL(storageUrl)
    const pathname = url.pathname
    
    // Remove leading slash and bucket name from pathname
    // Pathname format: /bucket-name/file/path.json
    const pathWithoutBucket = pathname.replace(`/${BUCKET_NAME}/`, "")
    
    if (pathWithoutBucket && pathWithoutBucket !== pathname) {
      fileName = pathWithoutBucket
    } else {
      // Fallback: try regex matching
      const match = storageUrl.match(new RegExp(`${BUCKET_NAME}/([^?]+)`))
      if (!match) {
        throw new Error(`Invalid storage URL format: ${storageUrl}`)
      }
      fileName = match[1]
    }
  } catch (urlError) {
    // Fallback to regex if URL parsing fails (e.g., invalid URL format)
    if (storageUrl.startsWith(`https://storage.googleapis.com/${BUCKET_NAME}/`)) {
      // Remove base URL and query parameters
      const urlWithoutBase = storageUrl.replace(`https://storage.googleapis.com/${BUCKET_NAME}/`, "")
      fileName = urlWithoutBase.split("?")[0] // Remove query parameters
    } else if (storageUrl.includes(`${BUCKET_NAME}/`)) {
      // Handle signed URLs with regex
      const match = storageUrl.match(new RegExp(`${BUCKET_NAME}/([^?]+)`))
      if (!match) {
        throw new Error(`Invalid storage URL format: ${storageUrl}`)
      }
      fileName = match[1]
    } else {
      throw new Error(`Invalid storage URL format: ${storageUrl}`)
    }
  }

  const bucket = storage.bucket(BUCKET_NAME)
  const file = bucket.file(fileName)

  // Download the file
  const [exists] = await file.exists()
  if (!exists) {
    throw new Error(`File not found in storage: ${fileName}`)
  }

  const [contents] = await file.download()
  const jsonString = contents.toString("utf8")
  
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    throw new Error(`Failed to parse JSON from storage: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

