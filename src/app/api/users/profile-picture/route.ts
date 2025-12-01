import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { uploadFileToGCS } from "@/lib/file-utils"
import { getStorageInstance, BUCKET_NAME } from "@/lib/gcs"

async function deleteOldProfilePicture(userId: string, oldUrl: string | null) {
  if (!oldUrl) return

  try {
    const storage = getStorageInstance()
    const bucket = storage.bucket(BUCKET_NAME)

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

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      )
    }

    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePictureUrl: true },
    })

    if (user?.profilePictureUrl) {
      await deleteOldProfilePicture(userId, user.profilePictureUrl)
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const fileName = `users/${userId}/profile-picture.${fileExtension}`

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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePictureUrl: true },
    })

    if (user?.profilePictureUrl) {
      await deleteOldProfilePicture(userId, user.profilePictureUrl)
    }

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

