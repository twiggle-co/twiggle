import { NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"
import { v4 as uuidv4 } from "uuid"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// Initialize Google Cloud Storage client using environment variables
function getStorageInstance(): Storage {
  const config: {
    projectId?: string
    keyFilename?: string
    credentials?: object
  } = {
    projectId: process.env.GCS_PROJECT_ID,
  }

  // Option 1: Use key file path from environment variable
  if (process.env.GCS_KEY_FILENAME) {
    config.keyFilename = process.env.GCS_KEY_FILENAME
    console.log("Using GCS_KEY_FILENAME for authentication")
    return new Storage(config)
  }

  // Option 2: Use credentials JSON from environment variable
  if (process.env.GCS_CREDENTIALS) {
    let credentialsString = process.env.GCS_CREDENTIALS.trim()

    // Try parsing as JSON first
    let parsedCredentials: any = null
    try {
      parsedCredentials = JSON.parse(credentialsString)
    } catch (parseError) {
      // If direct parse fails, try base64 decode
      try {
        const decoded = Buffer.from(credentialsString, "base64").toString("utf8")
        if (decoded.trim().startsWith("{")) {
          parsedCredentials = JSON.parse(decoded.trim())
        } else {
          throw parseError
        }
      } catch (base64Error) {
        // Replace escaped newlines and try again
        credentialsString = credentialsString.replace(/\\n/g, "\n")
        try {
          parsedCredentials = JSON.parse(credentialsString)
        } catch (finalError) {
          const errorMsg = parseError instanceof Error ? parseError.message : "Unknown error"
          throw new Error(
            `Failed to parse GCS_CREDENTIALS: ${errorMsg}. ` +
            `Ensure GCS_CREDENTIALS in .env.local is valid JSON. ` +
            `For multi-line JSON, escape newlines as \\n or use base64 encoding.`
          )
        }
      }
    }

    // Validate required fields
    if (
      !parsedCredentials.type ||
      !parsedCredentials.project_id ||
      !parsedCredentials.private_key ||
      !parsedCredentials.client_email
    ) {
      throw new Error(
        "GCS_CREDENTIALS is missing required fields. " +
        "Ensure it contains: type, project_id, private_key, and client_email."
      )
    }

    config.credentials = parsedCredentials
    
    // Use project_id from credentials if not set separately
    if (!config.projectId && parsedCredentials.project_id) {
      config.projectId = parsedCredentials.project_id
    }

    console.log("Using GCS_CREDENTIALS for authentication")
    return new Storage(config)
  }

  // No credentials found
  throw new Error(
    "No Google Cloud Storage credentials found. " +
    "Please set either GCS_KEY_FILENAME or GCS_CREDENTIALS in your .env.local file."
  )
}

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "twiggle-files"
const STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024 // 1GB

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Get file and projectId from request
    const formData = await request.formData()
    const file = formData.get("file") as File
    const projectId = formData.get("projectId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
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

    // 3. Check storage limit
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

    if (currentStorageBytes + file.size > STORAGE_LIMIT_BYTES) {
      const availableMB = Math.round(
        ((STORAGE_LIMIT_BYTES - currentStorageBytes) / (1024 * 1024)) * 100
      ) / 100

      return NextResponse.json(
        {
          error: "Storage limit exceeded",
          message: `This file would exceed your 1GB storage limit. Available space: ${availableMB} MB`,
        },
        { status: 413 }
      )
    }

    // 4. Prepare file for upload
    const fileId = uuidv4()
    const fileExtension = file.name.split(".").pop() || ""
    
    // Use unified storage structure: workflows/{projectId}/files/{fileId}.{ext}
    // If no projectId, fall back to old structure for backward compatibility
    const storageFileName = projectId
      ? `workflows/${projectId}/files/${fileId}.${fileExtension}`
      : `${fileId}.${fileExtension}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 5. Upload to Google Cloud Storage
    const storage = getStorageInstance()
    const bucket = storage.bucket(BUCKET_NAME)

    // Verify bucket exists
    const [bucketExists] = await bucket.exists()
    if (!bucketExists) {
      throw new Error(`Bucket "${BUCKET_NAME}" does not exist or is not accessible`)
    }

    const fileUpload = bucket.file(storageFileName)

    await fileUpload.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      },
    })

    // 6. Get storage URL (try public first, fallback to signed URL)
    let storageUrl: string
    try {
      await fileUpload.makePublic()
      storageUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${storageFileName}`
    } catch (makePublicError: any) {
      // If uniform bucket-level access is enabled, use signed URL
      if (
        makePublicError?.code === 400 &&
        makePublicError?.message?.includes("uniform bucket-level access")
      ) {
        const [signedUrl] = await fileUpload.getSignedUrl({
          action: "read",
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        storageUrl = signedUrl
      } else {
        // Fallback to public URL format (bucket might already be public)
        storageUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${storageFileName}`
      }
    }

    // 7. Save file metadata to database
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

    // 8. Return success response
    return NextResponse.json({
      fileId,
      fileName: file.name,
      size: file.size,
      type: file.type,
      storageUrl,
    })
  } catch (error: any) {
    console.error("Error uploading file:", error)

    // Handle specific error cases
    let errorMessage = "Failed to upload file"
    let statusCode = 500

    if (error?.message?.includes("No Google Cloud Storage credentials")) {
      errorMessage =
        "Google Cloud Storage credentials are not configured. " +
        "Please set GCS_CREDENTIALS or GCS_KEY_FILENAME in your .env.local file."
      statusCode = 500
    } else if (error?.message?.includes("Failed to parse GCS_CREDENTIALS")) {
      errorMessage = error.message
      statusCode = 500
    } else if (error?.code === 403 || error?.response?.status === 403) {
      errorMessage =
        "Permission denied: The service account does not have the required permissions " +
        "to upload files to Google Cloud Storage."
      statusCode = 403
    } else if (error?.code === 404 || error?.response?.status === 404) {
      errorMessage = `Bucket "${BUCKET_NAME}" not found. Please check that the bucket exists.`
      statusCode = 404
    } else if (error?.message) {
      errorMessage = error.message
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error?.message || "Unknown error",
      },
      { status: statusCode }
    )
  }
}

