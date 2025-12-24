import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { requireAuth, verifyProjectAccess, checkStorageLimit, handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { generateStorageFileName, uploadFileToGCS } from "@/lib/file-utils"
import {
  parseGoogleDriveUrl,
  getValidGoogleAccessToken,
  fetchDriveFileInfo,
  exportDriveFileAsPdf,
  downloadDriveFileMedia,
  type GoogleSourceKind,
} from "@/lib/google-drive"

type Body = {
  url?: string
  projectId?: string | null
}

type FetchMode = "export-pdf" | "media"

function pickFetchMode(mimeType: string): FetchMode {
  // Google Workspace file types must be exported. Others can be downloaded as media.
  return mimeType.startsWith("application/vnd.google-apps.") ? "export-pdf" : "media"
}

function ensureExtension(fileName: string, desiredExt: string): string {
  const lower = fileName.toLowerCase()
  if (lower.endsWith("." + desiredExt.toLowerCase())) return fileName
  return `${fileName}.${desiredExt}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = (await request.json()) as Body

    const url = (body.url || "").trim()
    const projectId = body.projectId ?? null

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    if (projectId) {
      await verifyProjectAccess(projectId, session.user.id)
    }

    const parsed = parseGoogleDriveUrl(url)
    if (!parsed) {
      return NextResponse.json(
        {
          error: "Unsupported URL. Please paste a Google Docs / Sheets / Slides / Drive link.",
        },
        { status: 400 }
      )
    }

    const accessToken = await getValidGoogleAccessToken(session.user.id)
    const info = await fetchDriveFileInfo(accessToken, parsed.fileId)

    const fetchMode = pickFetchMode(info.mimeType)

    // For Workspace Docs/Sheets/Slides, store as a PDF snapshot.
    // For non-Workspace Drive files, store the original bytes as-is.
    let buffer: Buffer
    let contentType: string
    let outputFileName: string

    if (fetchMode === "export-pdf") {
      buffer = await exportDriveFileAsPdf(accessToken, parsed.fileId)
      contentType = "application/pdf"
      outputFileName = ensureExtension(info.name, "pdf")
    } else {
      buffer = await downloadDriveFileMedia(accessToken, parsed.fileId)
      contentType = info.mimeType || "application/octet-stream"
      outputFileName = info.name
    }

    const storageCheck = await checkStorageLimit(session.user.id, buffer.length)
    if (storageCheck.exceeded) {
      return NextResponse.json(
        { error: "Storage limit exceeded", message: storageCheck.message },
        { status: 413 }
      )
    }

    const fileId = uuidv4()
    const extension =
      fetchMode === "export-pdf" ? "pdf" : (outputFileName.split(".").pop() || "").toLowerCase()

    const storageFileName = generateStorageFileName(fileId, extension, projectId)

    const sourceKind: GoogleSourceKind = info.kind || parsed.kindHint || "file"

    const storageUrl = await uploadFileToGCS(storageFileName, buffer, contentType, {
      originalName: outputFileName,
      // IMPORTANT: use ONE consistent sourceType for all google links
      sourceType: "google-drive",
      sourceUrl: url,
      sourceDocId: parsed.fileId,
      sourceKind,
      sourceMimeType: info.mimeType,
      sourceModifiedTime: info.modifiedTime || "",
      sourceFetchMode: fetchMode,
    })

    await prisma.file.create({
      data: {
        fileId,
        fileName: outputFileName,
        size: BigInt(buffer.length),
        type: contentType,
        storageUrl,
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      fileId,
      fileName: outputFileName,
      size: buffer.length,
      type: contentType,
      storageUrl,
      sourceType: "google-drive",
      sourceUrl: url,
      sourceDocId: parsed.fileId,
      sourceKind,
      sourceModifiedTime: info.modifiedTime || null,
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    return handleApiError(error, "Failed to import from URL")
  }
}

export const runtime = "nodejs"
