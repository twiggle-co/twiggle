import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { uploadJsonToGCS } from "@/lib/gcs"
import { v4 as uuidv4 } from "uuid"

// GET /api/projects - Get all projects for the authenticated user
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: {
        ownerId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description } = body

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    // Create project first
    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        ownerId: session.user.id,
      },
    })

    // Initialize empty workflow JSON in GCS
    try {
      const workflowData = {
        nodes: [],
        edges: [],
        metadata: {
          version: "1.0",
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.createdAt.toISOString(),
          projectId: project.id,
        },
      }

      const fileName = `workflows/${project.id}/${uuidv4()}.json`
      const storageUrl = await uploadJsonToGCS(fileName, workflowData)

      // Update project with workflow URL
      const updatedProject = await prisma.project.update({
        where: { id: project.id },
        data: { workflowDataUrl: storageUrl },
      })

      return NextResponse.json(updatedProject, { status: 201 })
    } catch (gcsError: any) {
      // If GCS upload fails, still return the project (workflow can be created later)
      console.error("Error initializing workflow in GCS:", gcsError)
      
      // Check for JWT signature error and provide helpful message
      if (gcsError?.message?.includes("Invalid JWT Signature") || 
          gcsError?.error === "invalid_grant") {
        console.error(
          "GCS Authentication Error: Invalid JWT Signature. " +
          "This usually means GCS_CREDENTIALS private_key is malformed. " +
          "Ensure newlines in private_key are escaped as \\n or use base64 encoding. " +
          "See docs/setup/FIX_JWT_SIGNATURE_ERROR.md for details."
        )
      }
      
      // Project is already created, so we return it even if workflow init failed
      return NextResponse.json(project, { status: 201 })
    }
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}

