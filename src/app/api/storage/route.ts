import { NextResponse } from "next/server"
import { requireAuth, getStorageUsageResponse, handleApiError } from "@/lib/api-utils"

/**
 * GET /api/storage
 * Get storage usage for the authenticated user
 */
export async function GET() {
  try {
    const session = await requireAuth()
    return await getStorageUsageResponse(session.user.id)
  } catch (error) {
    if (error instanceof NextResponse) return error
    return handleApiError(error, "Failed to fetch storage usage")
  }
}
