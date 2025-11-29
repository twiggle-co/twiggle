import { getStorageInstance, BUCKET_NAME } from "./gcs"
import type { File } from "@google-cloud/storage"

/**
 * MIME type mapping for common file extensions
 */
const MIME_TYPES: Record<string, string> = {
  md: "text/markdown",
  txt: "text/plain",
  json: "application/json",
  csv: "text/csv",
  yaml: "text/yaml",
  yml: "text/yaml",
  html: "text/html",
  xml: "application/xml",
  toml: "text/toml",
}

/**
 * Get MIME type from file type string
 * Example: "Markdown (.md)" -> "text/markdown"
 */
export function getMimeType(fileType: string): string {
  const extension = fileType.match(/\(\.(\w+)\)/)?.[1]?.toLowerCase() || ""
  return MIME_TYPES[extension] || "text/plain"
}

/**
 * Generate storage file name based on project ID and file ID
 */
export function generateStorageFileName(
  fileId: string,
  extension: string,
  projectId?: string | null
): string {
  if (projectId) {
    return `workflows/${projectId}/files/${fileId}.${extension}`
  }
  return `${fileId}.${extension}`
}

/**
 * Get file URL (public or signed) from GCS file
 */
async function getFileUrl(
  fileName: string,
  file: File
): Promise<string> {
  try {
    await file.makePublic()
    return `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`
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
      return signedUrl
    }
    // Fallback to public URL format
    return `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`
  }
}

/**
 * Upload file buffer to GCS and get storage URL
 */
export async function uploadFileToGCS(
  fileName: string,
  buffer: Buffer,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> {
  const storage = getStorageInstance()
  const bucket = storage.bucket(BUCKET_NAME)

  // Verify bucket exists
  const [bucketExists] = await bucket.exists()
  if (!bucketExists) {
    throw new Error(
      `Bucket "${BUCKET_NAME}" does not exist or is not accessible`
    )
  }

  const file = bucket.file(fileName)

  await file.save(buffer, {
    metadata: {
      contentType,
      metadata: {
        ...metadata,
        uploadedAt: new Date().toISOString(),
      },
    },
  })

  return getFileUrl(fileName, file)
}
