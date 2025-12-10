import { Storage } from "@google-cloud/storage"
import type { File, Bucket } from "@google-cloud/storage"
import path from "path"
import { stripQuotes } from "./env"

export const BUCKET_NAME = stripQuotes(process.env.GCS_BUCKET_NAME) || "twiggle-files"

const SIGNED_URL_EXPIRY_DAYS = 7
const SIGNED_URL_EXPIRY_MS = SIGNED_URL_EXPIRY_DAYS * 24 * 60 * 60 * 1000

interface GCSCredentials {
  private_key?: string
  project_id?: string
  [key: string]: unknown
}

function normalizePrivateKey(credentials: GCSCredentials): GCSCredentials {
  if (credentials && typeof credentials === "object" && credentials.private_key) {
    let privateKey = credentials.private_key

    privateKey = privateKey.replace(/\\n/g, "\n")
    privateKey = privateKey.trim()
    
    if (!privateKey.includes("\n")) {
      privateKey = privateKey.replace(
        /(-----BEGIN PRIVATE KEY-----)(.*?)(-----END PRIVATE KEY-----)/,
        "$1\n$2\n$3"
      )
    }
    
    if (!privateKey.startsWith("-----BEGIN")) {
      const beginIndex = privateKey.indexOf("-----BEGIN")
      if (beginIndex > 0) {
        privateKey = privateKey.substring(beginIndex)
      }
    }
    
    if (!privateKey.endsWith("-----")) {
      const endIndex = privateKey.lastIndexOf("-----END")
      if (endIndex > 0) {
        privateKey = privateKey.substring(0, endIndex + "-----END PRIVATE KEY-----".length)
      }
    }
    
    credentials.private_key = privateKey
  }
  return credentials
}

function getCredentials(): object | string {
  const credentialsEnv = stripQuotes(process.env.GCS_CREDENTIALS)
  if (credentialsEnv) {
    const credsStr = credentialsEnv.trim()

    try {
      const decoded = Buffer.from(credsStr, "base64").toString("utf8")
      const credentials = JSON.parse(decoded)
      return normalizePrivateKey(credentials)
    } catch {
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

  const keyFilename = stripQuotes(process.env.GCS_KEY_FILENAME)
  if (keyFilename) {
    return path.resolve(keyFilename)
  }

  return path.resolve("key/twiggle-479508-b9ea5eaacf83.json")
}

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

    const projectId = stripQuotes(process.env.GCS_PROJECT_ID)
    if (projectId) {
      config.projectId = projectId
    }

    if (typeof credentials === "string") {
      config.keyFilename = credentials
    } else {
      config.credentials = credentials
      if (!config.projectId && "project_id" in credentials && typeof credentials.project_id === "string") {
        config.projectId = credentials.project_id
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

async function getFileUrl(fileName: string, file: File): Promise<string> {
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
        expires: Date.now() + SIGNED_URL_EXPIRY_MS,
      })
      return signedUrl
    }
    return `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`
  }
}

async function verifyBucket(bucket: Bucket): Promise<void> {
  const [bucketExists] = await bucket.exists()
  if (!bucketExists) {
    throw new Error(
      `Bucket "${BUCKET_NAME}" does not exist or is not accessible`
    )
  }
}

export async function uploadJsonToGCS(
  fileName: string,
  data: unknown
): Promise<string> {
  try {
    const storage = getStorageInstance()
    const bucket = storage.bucket(BUCKET_NAME)

    await verifyBucket(bucket)

    const jsonString = JSON.stringify(data, null, 2)
    const buffer = Buffer.from(jsonString, "utf8")

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
    throw error
  }
}

export function extractFileNameFromUrl(storageUrl: string): string {
  if (storageUrl.includes(`${BUCKET_NAME}/`)) {
    const match = storageUrl.match(new RegExp(`${BUCKET_NAME}/([^?]+)`))
    if (match) {
      return match[1]
    }
  }

  try {
    const url = new URL(storageUrl)
    return url.pathname.replace(`/${BUCKET_NAME}/`, "").replace(/^\//, "")
  } catch {
  }

  throw new Error(`Invalid storage URL format: ${storageUrl}`)
}

export async function downloadJsonFromGCS(storageUrl: string): Promise<unknown> {
  try {
    const storage = getStorageInstance()
    const bucket = storage.bucket(BUCKET_NAME)

    const fileName = extractFileNameFromUrl(storageUrl)
    const file = bucket.file(fileName)

    const [exists] = await file.exists()
    if (!exists) {
      throw new Error(`File not found: ${fileName}`)
    }

    const [buffer] = await file.download()
    const jsonString = buffer.toString("utf8")
    return JSON.parse(jsonString)
  } catch (error) {
    const err = error as { code?: number; message?: string }
    if (err?.code === 404 || err?.message?.includes("does not exist")) {
      throw new Error(`File not found: ${storageUrl}`)
    }
    
    throw error
  }
}
