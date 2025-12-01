import { NextRequest, NextResponse } from "next/server"
import { getStorageInstance, BUCKET_NAME, extractFileNameFromUrl } from "@/lib/gcs"
import { handleApiError, requireAuth } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      )
    }

    const storage = getStorageInstance()
    const bucket = storage.bucket(BUCKET_NAME)
    const [files] = await bucket.getFiles({ prefix: fileId })

    if (files.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const file = files[0]
    const [exists] = await file.exists()

    if (!exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const [metadata, buffer] = await Promise.all([
      file.getMetadata(),
      file.download(),
    ])

    const originalName = metadata[0].metadata?.originalName || fileId
    const contentType =
      metadata[0].contentType || "application/octet-stream"

    return new NextResponse(new Uint8Array(buffer[0]), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${originalName}"`,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    return handleApiError(error, "Failed to retrieve file")
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await requireAuth()
    const { fileId } = await params

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      )
    }

    const fileRecord = await prisma.file.findUnique({
      where: { fileId },
    })

    if (!fileRecord) {
      try {
        const storage = getStorageInstance()
        const bucket = storage.bucket(BUCKET_NAME)
        const [files] = await bucket.getFiles({ prefix: fileId })
        
        if (files.length > 0) {
          await Promise.all(files.map((file) => file.delete()))
        }
      } catch (gcsError) {
      }
      
      return NextResponse.json({ 
        success: true, 
        message: "File not found in database (may have already been deleted)" 
      })
    }

    if (fileRecord.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    try {
      if (fileRecord.storageUrl) {
        const storage = getStorageInstance()
        const bucket = storage.bucket(BUCKET_NAME)
        
        const fileName = extractFileNameFromUrl(fileRecord.storageUrl)
        const file = bucket.file(fileName)
        
        const [exists] = await file.exists()
        if (exists) {
          await file.delete()
        }
      } else {
        const storage = getStorageInstance()
        const bucket = storage.bucket(BUCKET_NAME)
        const [files] = await bucket.getFiles({ prefix: fileId })
        
        if (files.length > 0) {
          await Promise.all(files.map((file) => file.delete()))
        }
      }
    } catch (gcsError: any) {
      if (gcsError?.code === 404) {
      } else {
      }
    }

    const deleteResult = await prisma.file.deleteMany({
      where: { fileId },
    })

    return NextResponse.json({ success: true, message: "File deleted successfully" })
  } catch (error) {
    return handleApiError(error, "Failed to delete file")
  }
}
