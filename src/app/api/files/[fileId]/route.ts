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

    // Find file in database
    const fileRecord = await prisma.file.findUnique({
      where: { fileId },
    })

    // If file doesn't exist in database, check if it exists in GCS and clean it up
    if (!fileRecord) {
      console.warn(`File record not found in database for fileId: ${fileId}, checking GCS...`)
      
      // Try to clean up from GCS if it exists there
      try {
        const storage = getStorageInstance()
        const bucket = storage.bucket(BUCKET_NAME)
        const [files] = await bucket.getFiles({ prefix: fileId })
        
        if (files.length > 0) {
          await Promise.all(files.map((file) => file.delete()))
          console.log(`Cleaned up ${files.length} orphaned file(s) from GCS for fileId: ${fileId}`)
        }
      } catch (gcsError) {
        console.error("Error cleaning up orphaned file from GCS:", gcsError)
      }
      
      // Return success even if file wasn't in database (idempotent deletion)
      return NextResponse.json({ 
        success: true, 
        message: "File not found in database (may have already been deleted)" 
      })
    }

    // Verify user owns the file
    if (fileRecord.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Delete from Google Cloud Storage using the storageUrl
    try {
      if (fileRecord.storageUrl) {
        const storage = getStorageInstance()
        const bucket = storage.bucket(BUCKET_NAME)
        
        // Extract the actual file name from the storageUrl
        const fileName = extractFileNameFromUrl(fileRecord.storageUrl)
        const file = bucket.file(fileName)
        
        // Check if file exists and delete it
        const [exists] = await file.exists()
        if (exists) {
          await file.delete()
          console.log(`Successfully deleted file from GCS: ${fileName}`)
        } else {
          console.warn(`File not found in GCS: ${fileName}, but continuing with database deletion`)
        }
      } else {
        console.warn(`No storageUrl found for fileId: ${fileId}, skipping GCS deletion`)
        
        // Try fallback: search by prefix (for backwards compatibility)
        const storage = getStorageInstance()
        const bucket = storage.bucket(BUCKET_NAME)
        const [files] = await bucket.getFiles({ prefix: fileId })
        
        if (files.length > 0) {
          await Promise.all(files.map((file) => file.delete()))
          console.log(`Deleted ${files.length} file(s) from GCS using prefix search fallback`)
        }
      }
    } catch (gcsError: any) {
      // Handle 404 errors gracefully (file already deleted)
      if (gcsError?.code === 404) {
        console.warn(`File not found in GCS (may have already been deleted): ${fileId}`)
      } else {
        console.error("Error deleting file from GCS:", gcsError)
      }
      // Continue with database deletion even if GCS deletion fails
    }

    // Delete from database using deleteMany (idempotent - doesn't throw if record doesn't exist)
    const deleteResult = await prisma.file.deleteMany({
      where: { fileId },
    })
    
    if (deleteResult.count > 0) {
      console.log(`Successfully deleted file record from database: ${fileId}`)
    } else {
      console.warn(`File record not found in database (may have already been deleted): ${fileId}`)
      // Still return success (idempotent deletion)
    }

    return NextResponse.json({ success: true, message: "File deleted successfully" })
  } catch (error) {
    return handleApiError(error, "Failed to delete file")
  }
}
