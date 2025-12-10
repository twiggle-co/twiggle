import { getStorageInstance, BUCKET_NAME } from "./gcs"
import type { File } from "@google-cloud/storage"

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

export function getMimeType(fileType: string): string {
  const extension = fileType.match(/\(\.(\w+)\)/)?.[1]?.toLowerCase() || ""
  return MIME_TYPES[extension] || "text/plain"
}

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

async function getFileUrl(
  fileName: string,
  file: File
): Promise<string> {
  try {
    await file.makePublic()
    return `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`
  } catch (makePublicError) {
    const error = makePublicError as { code?: number; message?: string }
    if (
      error?.code === 400 &&
      error?.message?.includes("uniform bucket-level access")
    ) {
      const [signedUrl] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      })
      return signedUrl
    }
    return `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`
  }
}

export async function uploadFileToGCS(
  fileName: string,
  buffer: Buffer,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> {
  const storage = getStorageInstance()
  const bucket = storage.bucket(BUCKET_NAME)

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
