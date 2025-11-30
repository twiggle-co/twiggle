import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "./prisma"
import { getStorageInstance, BUCKET_NAME, extractFileNameFromUrl } from "./gcs"

/**
 * Storage limit: 1GB
 */
const STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024

/**
 * Get the authenticated user session
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser() {
  const session = await auth()
  return session?.user?.id ? session : null
}

/**
 * Require authentication - throws error response if not authenticated
 */
export async function requireAuth(): Promise<{ user: { id: string } }> {
  const session = await getAuthenticatedUser()
  if (!session) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return session
}

/**
 * Get file size from GCS by URL
 */
async function getFileSizeFromGCS(storageUrl: string | null): Promise<number> {
  if (!storageUrl) return 0

  try {
    const storage = getStorageInstance()
    const bucket = storage.bucket(BUCKET_NAME)
    
    const fileName = extractFileNameFromUrl(storageUrl)
    const file = bucket.file(fileName)
    
    const [exists] = await file.exists()
    if (!exists) return 0
    
    const [metadata] = await file.getMetadata()
    return Number(metadata.size || 0)
  } catch (error) {
    console.error("Error getting file size from GCS:", error)
    return 0
  }
}

/**
 * Calculate total storage usage for a user
 */
export async function calculateStorageUsage(userId: string) {
  const [files, projects, user] = await Promise.all([
    prisma.file.findMany({
      where: { userId },
      select: { size: true },
    }),
    prisma.project.findMany({
      where: { ownerId: userId },
      select: { 
        title: true, 
        description: true,
        workflowDataUrl: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { profilePictureUrl: true },
    }),
  ])

  // File storage: files uploaded by user (includes files in project folders)
  const fileStorageBytes = files.reduce(
    (sum, file) => sum + Number(file.size),
    0
  )

  // Project metadata storage: titles and descriptions
  const projectMetadataBytes = projects.reduce((sum, project) => {
    const titleBytes = Buffer.byteLength(project.title, "utf8")
    const descBytes = project.description
      ? Buffer.byteLength(project.description, "utf8")
      : 0
    return sum + titleBytes + descBytes
  }, 0)

  // Workflow JSON files storage: get sizes from GCS
  const workflowFileSizes = await Promise.all(
    projects
      .filter(p => p.workflowDataUrl)
      .map(p => getFileSizeFromGCS(p.workflowDataUrl))
  )
  const workflowStorageBytes = workflowFileSizes.reduce((sum, size) => sum + size, 0)

  // Profile picture storage: get size from GCS
  const profilePictureBytes = await getFileSizeFromGCS(user?.profilePictureUrl || null)

  const total = fileStorageBytes + projectMetadataBytes + workflowStorageBytes + profilePictureBytes

  return {
    fileStorage: fileStorageBytes,
    projectStorage: projectMetadataBytes + workflowStorageBytes,
    profilePictureStorage: profilePictureBytes,
    total,
  }
}

/**
 * Check if adding bytes would exceed storage limit
 */
export async function checkStorageLimit(
  userId: string,
  additionalBytes: number
) {
  const { total } = await calculateStorageUsage(userId)
  const wouldExceed = total + additionalBytes > STORAGE_LIMIT_BYTES

  if (wouldExceed) {
    const availableBytes = STORAGE_LIMIT_BYTES - total
    const availableMB = Math.round((availableBytes / (1024 * 1024)) * 100) / 100
    return {
      exceeded: true,
      availableMB,
      message: `This would exceed your 1GB storage limit. Available space: ${availableMB} MB`,
    }
  }

  return { exceeded: false }
}

/**
 * Verify project exists and belongs to user
 */
export async function verifyProjectAccess(
  projectId: string,
  userId: string
) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
  })

  if (!project) {
    throw NextResponse.json(
      { error: "Project not found or access denied" },
      { status: 404 }
    )
  }

  return project
}

/**
 * Error types for better error handling
 */
type ApiError = {
  code?: string | number
  message?: string
  response?: { status?: number }
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown, defaultMessage: string) {
  console.error(defaultMessage, error)

  const errorObj = error as ApiError
  let message = defaultMessage
  let statusCode = 500

  // GCS credential errors
  if (
    errorObj?.message?.includes("No Google Cloud Storage credentials") ||
    errorObj?.message?.includes("GCS_CREDENTIALS") ||
    errorObj?.message?.includes("GCS_KEY_FILENAME")
  ) {
    message =
      "Google Cloud Storage credentials are not configured. " +
      "Please set GCS_CREDENTIALS or GCS_KEY_FILENAME in your environment variables."
    statusCode = 500
  }
  // Permission errors
  else if (errorObj?.code === 403 || errorObj?.response?.status === 403) {
    message =
      "Permission denied: The service account does not have the required permissions."
    statusCode = 403
  }
  // Not found errors
  else if (errorObj?.code === 404 || errorObj?.response?.status === 404) {
    message = errorObj?.message || "Resource not found"
    statusCode = 404
  }
  // Other errors
  else if (errorObj?.message) {
    message = errorObj.message
  }

  return NextResponse.json(
    {
      error: message,
      details: errorObj?.message || "Unknown error",
    },
    { status: statusCode }
  )
}

/**
 * Get storage usage response
 */
export async function getStorageUsageResponse(userId: string) {
  const { fileStorage, projectStorage, profilePictureStorage, total } =
    await calculateStorageUsage(userId)
  const percentage = (total / STORAGE_LIMIT_BYTES) * 100

  return NextResponse.json({
    used: total,
    limit: STORAGE_LIMIT_BYTES,
    percentage: Math.min(100, Number(percentage.toFixed(2))),
    fileStorage,
    projectStorage,
    profilePictureStorage,
  })
}
