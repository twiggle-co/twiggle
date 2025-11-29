import { NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"
import { v4 as uuidv4 } from "uuid"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// Initialize Google Cloud Storage
// Uses environment variables from .env.local (GCS_KEY_FILENAME or GCS_CREDENTIALS)
function getStorage() {
  const config: {
    projectId?: string
    keyFilename?: string
    credentials?: object
  } = {
    projectId: process.env.GCS_PROJECT_ID,
  }

  if (process.env.GCS_KEY_FILENAME) {
    config.keyFilename = process.env.GCS_KEY_FILENAME
    console.log("Using GCS_KEY_FILENAME for authentication")
  } else if (process.env.GCS_CREDENTIALS) {
    let credentialsString = process.env.GCS_CREDENTIALS.trim()
    
    // Try parsing as-is first
    let parsed: any = null
    try {
      parsed = JSON.parse(credentialsString)
    } catch (parseError) {
      // If direct parse fails, try base64 decode
      try {
        const decoded = Buffer.from(credentialsString, "base64").toString("utf8")
        if (decoded.trim().startsWith("{")) {
          credentialsString = decoded.trim()
          parsed = JSON.parse(credentialsString)
        } else {
          throw parseError
        }
      } catch (base64Error) {
        // If base64 decode fails, try to fix common issues
        // Replace escaped newlines (\\n -> \n)
        credentialsString = credentialsString.replace(/\\n/g, "\n")
        // Replace literal newlines in strings (for .env.local files)
        try {
          parsed = JSON.parse(credentialsString)
        } catch (finalError) {
          const errorMsg = parseError instanceof Error ? parseError.message : "Unknown error"
          throw new Error(
            `Failed to parse GCS_CREDENTIALS from environment variable: ${errorMsg}. ` +
            `Ensure GCS_CREDENTIALS in .env.local is valid JSON. ` +
            `For multi-line JSON, escape newlines as \\n or use base64 encoding.`
          )
        }
      }
    }
    
    config.credentials = parsed
    console.log("Successfully parsed GCS_CREDENTIALS from environment variable")
    
    // Validate that credentials have required fields
    const creds = config.credentials as any
    if (!creds.type || !creds.project_id || !creds.private_key || !creds.client_email) {
      throw new Error(
        "GCS_CREDENTIALS is missing required fields. " +
        "Ensure it contains: type, project_id, private_key, and client_email."
      )
    }
    console.log("GCS credentials validated successfully")
  } else {
    throw new Error(
      "No Google Cloud Storage credentials found in environment variables. " +
      "Please set either GCS_KEY_FILENAME or GCS_CREDENTIALS in your .env.local file."
    )
  }

  // Get project ID from environment variable or credentials
  if (!config.projectId) {
    if (config.credentials) {
      const creds = config.credentials as any
      config.projectId = creds.project_id
    }
    if (!config.projectId) {
      throw new Error("GCS_PROJECT_ID must be set in environment variables or included in GCS_CREDENTIALS")
    }
  }

  return new Storage(config)
}

let storage: Storage | null = null
function getStorageInstance(): Storage {
  if (!storage) {
    storage = getStorage()
  }
  return storage
}

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "twiggle-files"

// Map file type extensions to MIME types
function getMimeType(fileType: string): string {
  const extension = fileType.match(/\(\.(\w+)\)/)?.[1] || ""
  const mimeTypes: Record<string, string> = {
    md: "text/markdown",
    txt: "text/plain",
    json: "application/json",
    csv: "text/csv",
    yaml: "text/yaml",
    yml: "text/yaml",
    html: "text/html",
    xml: "application/xml",
    toml: "text/toml",
  }
  return mimeTypes[extension.toLowerCase()] || "text/plain"
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { fileName: originalFileName, fileType, projectId } = body

    if (!originalFileName || !fileType) {
      return NextResponse.json(
        { error: "File name and file type are required" },
        { status: 400 }
      )
    }

    // Validate projectId if provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          ownerId: session.user.id,
        },
      })
      if (!project) {
        return NextResponse.json(
          { error: "Project not found or access denied" },
          { status: 404 }
        )
      }
    }

    // Extract extension from fileType (e.g., "Markdown (.md)" -> ".md")
    const extensionMatch = fileType.match(/\(\.(\w+)\)/)
    const extension = extensionMatch ? `.${extensionMatch[1]}` : ""
    
    // Create full file name with extension
    const fullFileName = originalFileName.endsWith(extension) 
      ? originalFileName 
      : `${originalFileName}${extension}`

    // Check storage limit before creating
    const STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024 // 1GB
    const existingFiles = await prisma.file.findMany({
      where: { userId: session.user.id },
      select: { size: true },
    })
    const existingProjects = await prisma.project.findMany({
      where: { ownerId: session.user.id },
      select: { title: true, description: true },
    })

    const currentStorageBytes =
      existingFiles.reduce((sum, f) => sum + Number(f.size), 0) +
      existingProjects.reduce(
        (sum, p) =>
          sum +
          Buffer.byteLength(p.title, "utf8") +
          (p.description ? Buffer.byteLength(p.description, "utf8") : 0),
        0
      )

    // For new files, we'll estimate a small initial size (0 bytes since it's empty)
    // User will add content later
    const estimatedFileSize = 0

    if (currentStorageBytes + estimatedFileSize > STORAGE_LIMIT_BYTES) {
      const availableBytes = STORAGE_LIMIT_BYTES - currentStorageBytes
      return NextResponse.json(
        {
          error: "Storage limit exceeded",
          message: `Creating this file would exceed your 1GB storage limit. Available space: ${Math.round((availableBytes / (1024 * 1024)) * 100) / 100} MB`,
        },
        { status: 413 }
      )
    }

    // Generate unique file ID
    const fileId = uuidv4()
    
    // Use unified storage structure: workflows/{projectId}/files/{fileId}.{ext}
    // If no projectId, fall back to old structure for backward compatibility
    const storageFileName = projectId
      ? `workflows/${projectId}/files/${fileId}${extension}`
      : `${fileId}${extension}`
    const mimeType = getMimeType(fileType)

    // Create empty file content (user will add content later)
    const fileContent = ""
    const buffer = Buffer.from(fileContent, "utf8")

    // Upload to Google Cloud Storage
    console.log(`Creating new file: ${storageFileName} in bucket: ${BUCKET_NAME}`)
    const storageInstance = getStorageInstance()
    const bucket = storageInstance.bucket(BUCKET_NAME)
    
    const [bucketExists] = await bucket.exists()
    if (!bucketExists) {
      throw new Error(`Bucket "${BUCKET_NAME}" does not exist or is not accessible`)
    }

    const fileUpload = bucket.file(storageFileName)

    await fileUpload.save(buffer, {
      metadata: {
        contentType: mimeType,
        metadata: {
          originalName: fullFileName,
          createdAt: new Date().toISOString(),
          isCreated: "true", // Flag to indicate this was created (not uploaded)
        },
      },
    })

    // Try to make the file publicly accessible
    let storageUrl: string
    try {
      await fileUpload.makePublic()
      storageUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${storageFileName}`
    } catch (makePublicError: any) {
      if (makePublicError?.code === 400 && makePublicError?.message?.includes("uniform bucket-level access")) {
        console.log("Uniform bucket-level access enabled, using signed URL instead")
        const [signedUrl] = await fileUpload.getSignedUrl({
          action: "read",
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        storageUrl = signedUrl
      } else {
        storageUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${storageFileName}`
        console.warn("Could not make file public, using public URL:", makePublicError?.message)
      }
    }

    // Save file metadata to database
    await prisma.file.create({
      data: {
        fileId,
        fileName: fullFileName,
        size: BigInt(0), // Empty file initially
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
  } catch (error: any) {
    console.error("Error creating file:", error)
    
    let errorMessage = "Failed to create file"
    let statusCode = 500
    
    if (error?.message?.includes("No Google Cloud Storage credentials")) {
      errorMessage = "Google Cloud Storage credentials are not configured."
      statusCode = 500
    } else if (error?.code === 403 || error?.response?.status === 403) {
      errorMessage = "Permission denied: The service account does not have the required permissions."
      statusCode = 403
    } else if (error?.code === 404 || error?.response?.status === 404) {
      errorMessage = `Bucket "${BUCKET_NAME}" not found.`
      statusCode = 404
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: error?.response?.data || error?.message || "Unknown error",
      },
      { status: statusCode }
    )
  }
}

