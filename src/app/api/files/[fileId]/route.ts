import { NextRequest, NextResponse } from "next/server"
import { getStorageInstance, BUCKET_NAME } from "@/lib/gcs"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    // Get file from bucket
    // Files are stored as {fileId}.{extension}
    const storageInstance = getStorageInstance()
    const bucket = storageInstance.bucket(BUCKET_NAME)
    
    // Try to find the file by listing files with the prefix
    const [files] = await bucket.getFiles({ prefix: fileId })

    if (files.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Get the first matching file (should be unique based on fileId)
    const file = files[0]
    const [exists] = await file.exists()

    if (!exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Get file metadata
    const [metadata] = await file.getMetadata()
    const originalName = metadata.metadata?.originalName || fileId

    // Download file content
    const [buffer] = await file.download()

    // Determine content type
    const contentType = metadata.contentType || "application/octet-stream"

    // Convert Buffer to Uint8Array for NextResponse compatibility
    // This ensures we have a proper ArrayBuffer-like type that NextResponse accepts
    const uint8Array = new Uint8Array(buffer)

    // Return file with appropriate headers
    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${originalName}"`,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error: any) {
    console.error("Error retrieving file:", error)
    
    // Provide helpful error messages for common issues
    let errorMessage = "Failed to retrieve file"
    let statusCode = 500
    
    if (error?.code === 403 || error?.response?.status === 403) {
      errorMessage = "Permission denied: The service account does not have the required permissions to access files from Google Cloud Storage."
      statusCode = 403
    } else if (error?.code === 404 || error?.response?.status === 404) {
      errorMessage = `Bucket "${BUCKET_NAME}" not found. Please check that the bucket exists and the bucket name is correct.`
      statusCode = 404
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: error?.response?.data || error?.message || "Unknown error",
        hint: error?.code === 403
          ? "Ensure the service account has 'Storage Object Viewer' or 'Storage Object Admin' role on the bucket."
          : undefined,
      },
      { status: statusCode }
    )
  }
}

