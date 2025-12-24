import { prisma } from "@/lib/prisma"

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

export type GoogleSourceKind = "document" | "spreadsheet" | "presentation" | "file"

export type ParsedGoogleUrl = {
  fileId: string
  kindHint?: GoogleSourceKind
}

/**
 * Supports:
 * - https://docs.google.com/document/d/<ID>/...
 * - https://docs.google.com/spreadsheets/d/<ID>/...
 * - https://docs.google.com/presentation/d/<ID>/...
 * - https://drive.google.com/file/d/<ID>/...
 * - https://drive.google.com/open?id=<ID>
 */
export function parseGoogleDriveUrl(rawUrl: string): ParsedGoogleUrl | null {
  try {
    const url = new URL(rawUrl)

    // Docs / Sheets / Slides
    const docMatch = url.pathname.match(/\/document\/d\/([^/]+)/)
    if (docMatch?.[1]) return { fileId: docMatch[1], kindHint: "document" }

    const sheetMatch = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/)
    if (sheetMatch?.[1]) return { fileId: sheetMatch[1], kindHint: "spreadsheet" }

    const slidesMatch = url.pathname.match(/\/presentation\/d\/([^/]+)/)
    if (slidesMatch?.[1]) return { fileId: slidesMatch[1], kindHint: "presentation" }

    // Drive file
    const driveFileMatch = url.pathname.match(/\/file\/d\/([^/]+)/)
    if (driveFileMatch?.[1]) return { fileId: driveFileMatch[1], kindHint: "file" }

    // Drive open?id=
    const id = url.searchParams.get("id")
    if (id) return { fileId: id, kindHint: "file" }

    return null
  } catch {
    return null
  }
}

type GoogleAccountRow = {
  access_token: string | null
  refresh_token: string | null
  expires_at: number | null // seconds since epoch
}

async function getGoogleAccount(userId: string): Promise<GoogleAccountRow | null> {
  const acct = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: {
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
  })
  return acct as GoogleAccountRow | null
}

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET")
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  const json = (await res.json()) as {
    access_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  }

  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || "Failed to refresh Google access token")
  }

  const expiresAt = Math.floor(Date.now() / 1000) + (json.expires_in ?? 3600)
  return { accessToken: json.access_token, expiresAt }
}

export async function getValidGoogleAccessToken(userId: string): Promise<string> {
  const acct = await getGoogleAccount(userId)
  if (!acct) {
    throw new Error("Google account not linked. Please sign in with Google.")
  }

  const now = Math.floor(Date.now() / 1000)
  const expiresAt = acct.expires_at ?? 0
  const stillValid = acct.access_token && expiresAt - now > 60
  if (stillValid) return acct.access_token as string

  if (!acct.refresh_token) {
    // This happens if the OAuth consent didn't include access_type=offline + prompt=consent,
    // or if the user never re-consented after you added Drive scopes.
    throw new Error("Missing Google refresh token. Please sign out and sign in again.")
  }

  const refreshed = await refreshAccessToken(acct.refresh_token)
  await prisma.account.updateMany({
    where: { userId, provider: "google" },
    data: {
      access_token: refreshed.accessToken,
      expires_at: refreshed.expiresAt,
    },
  })

  return refreshed.accessToken
}

export type GoogleDriveFileInfo = {
  name: string
  mimeType: string
  modifiedTime?: string | null
  kind: GoogleSourceKind
  isGoogleWorkspaceFile: boolean
}

export async function fetchDriveFileInfo(accessToken: string, fileId: string): Promise<GoogleDriveFileInfo> {
  const fields = "name,mimeType,modifiedTime"
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(fields)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  const json = (await res.json()) as {
    name?: string
    mimeType?: string
    modifiedTime?: string
    error?: { message?: string }
  }

  if (!res.ok) {
    throw new Error(json?.error?.message || "Failed to read Google Drive file metadata")
  }

  const mimeType = json.mimeType || "application/octet-stream"
  const isGoogleWorkspaceFile = mimeType.startsWith("application/vnd.google-apps.")
  const kind: GoogleSourceKind =
    mimeType === "application/vnd.google-apps.document"
      ? "document"
      : mimeType === "application/vnd.google-apps.spreadsheet"
        ? "spreadsheet"
        : mimeType === "application/vnd.google-apps.presentation"
          ? "presentation"
          : "file"

  return {
    name: json.name || "Google Drive file",
    mimeType,
    modifiedTime: json.modifiedTime || null,
    kind,
    isGoogleWorkspaceFile,
  }
}

export async function exportDriveFileAsPdf(accessToken: string, fileId: string): Promise<Buffer> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=${encodeURIComponent(
      "application/pdf"
    )}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    // Drive export errors are often JSON, but sometimes not
    let msg = "Failed to export file as PDF"
    try {
      const json = (await res.json()) as { error?: { message?: string } }
      msg = json?.error?.message || msg
    } catch {
      // ignore
    }
    throw new Error(msg)
  }

  const arr = await res.arrayBuffer()
  return Buffer.from(arr)
}

export async function downloadDriveFileMedia(accessToken: string, fileId: string): Promise<Buffer> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    let msg = "Failed to download file content"
    try {
      const json = (await res.json()) as { error?: { message?: string } }
      msg = json?.error?.message || msg
    } catch {
      // ignore
    }
    throw new Error(msg)
  }

  const arr = await res.arrayBuffer()
  return Buffer.from(arr)
}
