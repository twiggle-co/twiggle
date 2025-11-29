import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { uploadJsonToGCS, downloadJsonFromGCS, BUCKET_NAME } from "@/lib/gcs"
import { v4 as uuidv4 } from "uuid"

// GET /api/projects/[id]/workflow - Load workflow data (nodes + edges) from GCS
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify project exists and belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        workflowDataUrl: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      } as any,
    }) as any

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // If no workflow data URL, return empty workflow
    if (!project.workflowDataUrl) {
      return NextResponse.json({
        nodes: [],
        edges: [],
        metadata: {
          version: "1.0",
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        },
      })
    }

    // Download workflow data from GCS
    try {
      const workflowData = await downloadJsonFromGCS(project.workflowDataUrl)
      return NextResponse.json(workflowData)
    } catch (error: any) {
      console.error("Error loading workflow from GCS:", error)
      
      // If file doesn't exist, clear the invalid URL and return empty workflow
      if (error?.message?.includes("File not found") || error?.message?.includes("does not exist")) {
        // Clear the invalid workflow URL from database
        await prisma.project.update({
          where: { id },
          data: { workflowDataUrl: null } as any,
        }).catch((updateError) => {
          console.error("Error clearing invalid workflow URL:", updateError)
        })
      }
      
      // Return empty workflow
      return NextResponse.json({
        nodes: [],
        edges: [],
        metadata: {
          version: "1.0",
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        },
      })
    }
  } catch (error) {
    console.error("Error fetching workflow:", error)
    return NextResponse.json(
      { error: "Failed to fetch workflow" },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/workflow - Save workflow data (nodes + edges) to GCS
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify project exists and belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        workflowDataUrl: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      } as any,
    }) as any

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { nodes, edges, metadata } = body

    // Validate data structure
    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return NextResponse.json(
        { error: "Invalid workflow data: nodes and edges must be arrays" },
        { status: 400 }
      )
    }

    // Create workflow data structure
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
    let fileName: string
    if (project.workflowDataUrl) {
      // Extract filename from existing URL
      const urlMatch = project.workflowDataUrl.match(
        new RegExp(`${BUCKET_NAME}/([^?]+)`)
      )
      if (urlMatch) {
        fileName = urlMatch[1]
      } else {
        fileName = `workflows/${id}/${uuidv4()}.json`
      }
    } else {
      fileName = `workflows/${id}/${uuidv4()}.json`
    }

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
  } catch (error: any) {
    console.error("Error saving workflow:", error)

    // Handle specific error cases
    let errorMessage = "Failed to save workflow"
    let statusCode = 500

    if (error?.message?.includes("No Google Cloud Storage credentials")) {
      errorMessage =
        "Google Cloud Storage credentials are not configured. " +
        "Please set GCS_CREDENTIALS or GCS_KEY_FILENAME in your .env.local file."
      statusCode = 500
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

