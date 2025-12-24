import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { getStorageInstance, BUCKET_NAME, extractFileNameFromUrl } from "@/lib/gcs"
import {
  getValidGoogleAccessToken,
  fetchDriveFileInfo,
  exportDriveFileAsPdf,
  downloadDriveFileMedia,
  type GoogleSourceKind,
} from "@/lib/google-drive"

type FetchMode = "export-pdf" | "media"

function ensureExtension(fileName: string, desiredExt: string): string {
  const lower = fileName.toLowerCase()
  if (lower.endsWith("." + desiredExt.toLowerCase())) return fileName
  return `${fileName}.${desiredExt}`
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await requireAuth()
    const { fileId } = await params

    const fileRecord = await prisma.file.findUnique({ where: { fileId } })
    if (!fileRecord) return NextResponse.json({ error: "File not found" }, { status: 404 })
    if (fileRecord.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    if (!fileRecord.storageUrl) {
      return NextResponse.json({ error: "Missing storageUrl for this file" }, { status: 400 })
    }

    const storage = getStorageInstance()
    const bucket = storage.bucket(BUCKET_NAME)
    const objectName = extractFileNameFromUrl(fileRecord.storageUrl)
    const gcsFile = bucket.file(objectName)

    const [exists] = await gcsFile.exists()
    if (!exists) return NextResponse.json({ error: "Stored object not found" }, { status: 404 })

    const [meta] = await gcsFile.getMetadata()
    const custom = (meta.metadata || {}) as Record<string, string>

    if (custom.sourceType !== "google-drive" || !custom.sourceDocId) {
      return NextResponse.json(
        { error: "This file is not a syncable Google Drive import" },
        { status: 400 }
      )
    }

    const sourceDocId = custom.sourceDocId
    const fetchMode = (custom.sourceFetchMode as FetchMode) || "export-pdf"

    const accessToken = await getValidGoogleAccessToken(session.user.id)
    const info = await fetchDriveFileInfo(accessToken, sourceDocId)

    let buffer: Buffer
    let contentType: string
    let outputFileName: string

    if (fetchMode === "media") {
      buffer = await downloadDriveFileMedia(accessToken, sourceDocId)
      contentType = info.mimeType || "application/octet-stream"
      outputFileName = info.name
    } else {
      buffer = await exportDriveFileAsPdf(accessToken, sourceDocId)
      contentType = "application/pdf"
      outputFileName = ensureExtension(info.name, "pdf")
    }

    const sourceKind = (custom.sourceKind as GoogleSourceKind) || info.kind || "file"

    await gcsFile.save(buffer, {
      metadata: {
        contentType,
        metadata: {
          ...custom,
          originalName: outputFileName,
          sourceMimeType: info.mimeType,
          sourceKind,
          sourceModifiedTime: info.modifiedTime || "",
          syncedAt: new Date().toISOString(),
          // keep sourceFetchMode + sourceUrl + sourceDocId
        },
      },
    })

    await prisma.file.update({
      where: { fileId },
      data: {
        fileName: outputFileName,
        size: BigInt(buffer.length),
        type: contentType,
      },
    })

    return NextResponse.json({
      fileId,
      fileName: outputFileName,
      size: buffer.length,
      type: contentType,
      storageUrl: fileRecord.storageUrl,
      sourceType: "google-drive",
      sourceUrl: custom.sourceUrl || null,
      sourceDocId,
      sourceKind,
      sourceModifiedTime: info.modifiedTime || null,
      syncedAt: new Date().toISOString(),
    })
  } catch (error) {
    return handleApiError(error, "Failed to sync file")
  }
}

export const runtime = "nodejs"
