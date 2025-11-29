import { NextRequest, NextResponse } from "next/server"
import { getStorageInstance, BUCKET_NAME } from "@/lib/gcs"
import { handleApiError } from "@/lib/api-utils"

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

    // Find file by prefix
    const [files] = await bucket.getFiles({ prefix: fileId })

    if (files.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const file = files[0]
    const [exists] = await file.exists()

    if (!exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Get file metadata and content
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
