import { NextRequest, NextResponse } from "next/server"
import { requireAuth, verifyProjectAccess, handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { uploadJsonToGCS, downloadJsonFromGCS, extractFileNameFromUrl } from "@/lib/gcs"
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const project = await verifyProjectAccess(id, session.user.id)

    if (!project.workflowDataUrl) {
      return NextResponse.json(createEmptyWorkflow(project))
    }

    try {
      const workflowData = await downloadJsonFromGCS(project.workflowDataUrl)
      return NextResponse.json(workflowData)
    } catch (error: any) {
      if (
        error?.message?.includes("File not found") ||
        error?.message?.includes("does not exist")
      ) {
        await prisma.project
          .update({
            where: { id },
            data: { workflowDataUrl: null } as any,
          })
          .catch(() => {})
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

    const existingFileName = project.workflowDataUrl
      ? extractFileNameFromUrl(project.workflowDataUrl)
      : null
    const fileName = existingFileName || `workflows/${id}/${uuidv4()}.json`

    const storageUrl = await uploadJsonToGCS(fileName, workflowData)

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
