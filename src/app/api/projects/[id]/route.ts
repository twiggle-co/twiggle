import { NextRequest, NextResponse } from "next/server"
import { requireAuth, verifyProjectAccess, handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/projects/[id]
 * Get a specific project
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const project = await verifyProjectAccess(id, session.user.id)
    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof NextResponse) return error
    return handleApiError(error, "Failed to fetch project")
  }
}

/**
 * PATCH /api/projects/[id]
 * Update a project
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    await verifyProjectAccess(id, session.user.id)

    const body = await request.json()
    const { title, description } = body

    const updateData: { title?: string; description?: string } = {}
    
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json(
          { error: "Title must be a non-empty string" },
          { status: 400 }
        )
      }
      updateData.title = title.trim()
    }
    
    if (description !== undefined) {
      updateData.description = description?.trim() || ""
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof NextResponse) return error
    return handleApiError(error, "Failed to update project")
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    await verifyProjectAccess(id, session.user.id)

    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof NextResponse) return error
    return handleApiError(error, "Failed to delete project")
  }
}
