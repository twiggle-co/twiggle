import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { requireAuth, verifyProjectAccess, checkStorageLimit, handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { getMimeType, generateStorageFileName, uploadFileToGCS } from "@/lib/file-utils"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const { fileName: originalFileName, fileType, projectId } = body

    if (!originalFileName || !fileType) {
      return NextResponse.json(
        { error: "File name and file type are required" },
        { status: 400 }
      )
    }

    // Validate project access if projectId provided
    if (projectId) {
      await verifyProjectAccess(projectId, session.user.id)
    }

    // Extract extension and create full file name
    const extensionMatch = fileType.match(/\(\.(\w+)\)/)
    const extension = extensionMatch ? `.${extensionMatch[1]}` : ""
    const fullFileName = originalFileName.endsWith(extension)
      ? originalFileName
      : `${originalFileName}${extension}`

    // Check storage limit (empty file = 0 bytes)
    const storageCheck = await checkStorageLimit(session.user.id, 0)
    if (storageCheck.exceeded) {
      return NextResponse.json(
        {
          error: "Storage limit exceeded",
          message: storageCheck.message,
        },
        { status: 413 }
      )
    }

    // Generate file ID and storage path
    const fileId = uuidv4()
    const storageFileName = generateStorageFileName(
      fileId,
      extension.replace(/^\./, ""),
      projectId
    )
    const mimeType = getMimeType(fileType)

    // Upload empty file to GCS
    const buffer = Buffer.from("", "utf8")
    const storageUrl = await uploadFileToGCS(
      storageFileName,
      buffer,
      mimeType,
      {
        originalName: fullFileName,
        isCreated: "true",
      }
    )

    // Save file metadata to database
    await prisma.file.create({
      data: {
        fileId,
        fileName: fullFileName,
        size: BigInt(0),
        type: mimeType,
        storageUrl,
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      fileId,
      fileName: fullFileName,
      size: 0,
      type: mimeType,
      storageUrl,
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    return handleApiError(error, "Failed to create file")
  }
}
