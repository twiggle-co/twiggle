import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { uploadJsonToGCS } from "@/lib/gcs"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  try {
    const session = await requireAuth()

    const projects = await prisma.project.findMany({
      where: { ownerId: session.user.id },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(projects)
  } catch (error) {
    if (error instanceof NextResponse) return error
    return handleApiError(error, "Failed to fetch projects")
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const { title, description } = body

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        ownerId: session.user.id,
      },
    })

    // Initialize empty workflow in GCS
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

      const updatedProject = await prisma.project.update({
        where: { id: project.id },
        data: { workflowDataUrl: storageUrl } as any,
      })

      return NextResponse.json(updatedProject, { status: 201 })
    } catch (gcsError) {
      // If GCS upload fails, still return the project (workflow can be created later)
      console.error("Failed to initialize workflow in GCS:", gcsError)
      return NextResponse.json(project, { status: 201 })
    }
  } catch (error) {
    if (error instanceof NextResponse) return error
    return handleApiError(error, "Failed to create project")
  }
}
