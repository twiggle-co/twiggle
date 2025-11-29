import { NextRequest, NextResponse } from "next/server"
import { requireAuth, verifyProjectAccess, handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { uploadJsonToGCS, downloadJsonFromGCS, BUCKET_NAME } from "@/lib/gcs"
import { v4 as uuidv4 } from "uuid"

function createEmptyWorkflow(project: { createdAt: Date; updatedAt: Date }) {
  return {
    nodes: [],
    edges: [],
    metadata: {
      version: "1.0",
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    },
  }
}

function extractFileNameFromUrl(url: string): string | null {
  const match = url.match(new RegExp(`${BUCKET_NAME}/([^?]+)`))
  return match ? match[1] : null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const project = await verifyProjectAccess(id, session.user.id)

    // If no workflow data URL, return empty workflow
    if (!project.workflowDataUrl) {
      return NextResponse.json(createEmptyWorkflow(project))
    }

    // Download workflow data from GCS
    try {
      const workflowData = await downloadJsonFromGCS(project.workflowDataUrl)
      return NextResponse.json(workflowData)
    } catch (error: any) {
      // If file doesn't exist, clear the invalid URL and return empty workflow
      if (
        error?.message?.includes("File not found") ||
        error?.message?.includes("does not exist")
      ) {
        await prisma.project
          .update({
            where: { id },
            data: { workflowDataUrl: null } as any,
          })
          .catch(() => {
            // Ignore update errors
          })
      }

      return NextResponse.json(createEmptyWorkflow(project))
    }
  } catch (error) {
    if (error instanceof NextResponse) return error
    return handleApiError(error, "Failed to fetch workflow")
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const project = await verifyProjectAccess(id, session.user.id)

    const body = await request.json()
    const { nodes, edges, metadata } = body

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return NextResponse.json(
        { error: "Invalid workflow data: nodes and edges must be arrays" },
        { status: 400 }
      )
    }

    const workflowData = {
      nodes,
      edges,
      metadata: {
        version: metadata?.version || "1.0",
        createdAt: metadata?.createdAt || project.createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
        projectId: id,
      },
    }

    // Determine file name (use existing if available, otherwise create new)
    const existingFileName = project.workflowDataUrl
      ? extractFileNameFromUrl(project.workflowDataUrl)
      : null
    const fileName =
      existingFileName || `workflows/${id}/${uuidv4()}.json`

    // Upload to GCS
    const storageUrl = await uploadJsonToGCS(fileName, workflowData)

    // Update project with new workflow URL
    await prisma.project.update({
      where: { id },
      data: {
        workflowDataUrl: storageUrl,
        updatedAt: new Date(),
      } as any,
    })

    return NextResponse.json({
      success: true,
      storageUrl,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    return handleApiError(error, "Failed to save workflow")
  }
}
