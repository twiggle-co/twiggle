import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { requireAuth, verifyProjectAccess, checkStorageLimit, handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { generateStorageFileName, uploadFileToGCS } from "@/lib/file-utils"

/**
 * POST /api/files/upload
 * Upload a file
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    const formData = await request.formData()
    const file = formData.get("file") as File
    const projectId = formData.get("projectId") as string | null

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate project access if projectId provided
    if (projectId) {
      await verifyProjectAccess(projectId, session.user.id)
    }

    // Check storage limit
    const storageCheck = await checkStorageLimit(session.user.id, file.size)
    if (storageCheck.exceeded) {
      return NextResponse.json(
        {
          error: "Storage limit exceeded",
          message: storageCheck.message,
        },
        { status: 413 }
      )
    }

    // Prepare file for upload
    const fileId = uuidv4()
    const fileExtension = file.name.split(".").pop() || ""
    const storageFileName = generateStorageFileName(
      fileId,
      fileExtension,
      projectId
    )

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to GCS
    const storageUrl = await uploadFileToGCS(
      storageFileName,
      buffer,
      file.type,
      {
        originalName: file.name,
      }
    )

    // Save file metadata to database
    await prisma.file.create({
      data: {
        fileId,
        fileName: file.name,
        size: BigInt(file.size),
        type: file.type,
        storageUrl,
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      fileId,
      fileName: file.name,
      size: file.size,
      type: file.type,
      storageUrl,
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    return handleApiError(error, "Failed to upload file")
  }
}
