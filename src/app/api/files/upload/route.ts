import { NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"
import { v4 as uuidv4 } from "uuid"

// Initialize Google Cloud Storage
// Supports both keyFilename and credentials from environment variables
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
  } else if (process.env.GCS_CREDENTIALS) {
    try {
      config.credentials = JSON.parse(process.env.GCS_CREDENTIALS)
    } catch (error) {
      console.error("Error parsing GCS_CREDENTIALS:", error)
    }
  }

  return new Storage(config)
}

const storage = getStorage()

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "twiggle-files"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate unique file ID
    const fileId = uuidv4()
    const fileExtension = file.name.split(".").pop() || ""
    const fileName = `${fileId}.${fileExtension}`

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Google Cloud Storage
    const bucket = storage.bucket(BUCKET_NAME)
    const fileUpload = bucket.file(fileName)

    await fileUpload.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      },
    })

    // Make the file publicly accessible (or use signed URLs for private files)
    await fileUpload.makePublic()

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`

    // For private files, you can generate a signed URL instead:
    // const [signedUrl] = await fileUpload.getSignedUrl({
    //   action: "read",
    //   expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    // })

    return NextResponse.json({
      fileId,
      fileName: file.name,
      size: file.size,
      type: file.type,
      storageUrl: publicUrl,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

