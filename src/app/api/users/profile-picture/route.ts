import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { uploadFileToGCS } from "@/lib/file-utils"
import { getStorageInstance, BUCKET_NAME } from "@/lib/gcs"
import type { File as GCSFile } from "@google-cloud/storage"

/**
 * Get file URL (public or signed) from GCS file
 */
async function getFileUrl(fileName: string, file: GCSFile): Promise<string> {
  try {
    await file.makePublic()
    return `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`
  } catch (makePublicError: any) {
    // If uniform bucket-level access is enabled, use V4 signed URL
    if (
      makePublicError?.code === 400 &&
      makePublicError?.message?.includes("uniform bucket-level access")
    ) {
      const [signedUrl] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      return signedUrl
    }
    return `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`
  }
}

/**
 * Delete old profile picture from GCS if it exists
 */
async function deleteOldProfilePicture(userId: string, oldUrl: string | null) {
  if (!oldUrl) return

  try {
    const storage = getStorageInstance()
    const bucket = storage.bucket(BUCKET_NAME)

    // Extract file name from URL
    const match = oldUrl.match(new RegExp(`${BUCKET_NAME}/users/${userId}/([^?]+)`))
    if (match) {
      const fileName = `users/${userId}/${match[1]}`
      const file = bucket.file(fileName)
      const [exists] = await file.exists()
      if (exists) {
        await file.delete()
      }
    }
  } catch (error) {
    // Log but don't fail if deletion fails
    console.error("Failed to delete old profile picture:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const formData = await request.formData()
    const fileEntry = formData.get("file")

    if (!fileEntry || !(fileEntry instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    const file = fileEntry

    // Validate file type (only images)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      )
    }

    // Get current user to check for old profile picture
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePictureUrl: true },
    })

    // Delete old profile picture if it exists
    if (user?.profilePictureUrl) {
      await deleteOldProfilePicture(userId, user.profilePictureUrl)
    }

    // Generate file name: users/{userId}/profile-picture.{ext}
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const fileName = `users/${userId}/profile-picture.${fileExtension}`

    // Upload file to GCS
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const storageUrl = await uploadFileToGCS(
      fileName,
      buffer,
      file.type,
      {
        originalName: file.name,
        userId,
      }
    )

    // Update user profile picture URL in database
    await prisma.user.update({
      where: { id: userId },
      data: { profilePictureUrl: storageUrl },
    })

    return NextResponse.json({
      success: true,
      profilePictureUrl: storageUrl,
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    return handleApiError(error, "Failed to upload profile picture")
  }
}

export async function DELETE() {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    // Get current user to check for profile picture
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePictureUrl: true },
    })

    // Delete profile picture from GCS if it exists
    if (user?.profilePictureUrl) {
      await deleteOldProfilePicture(userId, user.profilePictureUrl)
    }

    // Remove profile picture URL from database
    await prisma.user.update({
      where: { id: userId },
      data: { profilePictureUrl: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof NextResponse) return error
    return handleApiError(error, "Failed to delete profile picture")
  }
}

