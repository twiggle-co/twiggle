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
      console.log(`[DEBUG] Attempting to upload workflow to GCS: ${fileName}`)
      const storageUrl = await uploadJsonToGCS(fileName, workflowData)
      console.log(`[DEBUG] Successfully uploaded workflow to GCS: ${storageUrl}`)

      // Update project with workflow URL
      const updatedProject = await prisma.project.update({
        where: { id: project.id },
        data: { workflowDataUrl: storageUrl } as any, // Type assertion for out-of-sync Prisma client
      })

      return NextResponse.json(updatedProject, { status: 201 })
    } catch (gcsError: any) {
      // If GCS upload fails, still return the project (workflow can be created later)
      console.error("=".repeat(80))
      console.error("[ERROR] Failed to initialize workflow in GCS")
      console.error("=".repeat(80))
      
      // Log error details
      console.error("[DEBUG] Error type:", typeof gcsError)
      console.error("[DEBUG] Error name:", gcsError?.name)
      console.error("[DEBUG] Error message:", gcsError?.message)
      console.error("[DEBUG] Error code:", gcsError?.code)
      console.error("[DEBUG] Error status:", gcsError?.status)
      console.error("[DEBUG] Error response:", gcsError?.response ? JSON.stringify(gcsError.response, null, 2) : "N/A")
      
      // Log environment variable status (without exposing secrets)
      console.error("[DEBUG] Environment variables check:")
      console.error("  - GCS_PROJECT_ID:", process.env.GCS_PROJECT_ID ? `Set (${process.env.GCS_PROJECT_ID.length} chars)` : "NOT SET")
      console.error("  - GCS_BUCKET_NAME:", process.env.GCS_BUCKET_NAME ? `Set (${process.env.GCS_BUCKET_NAME.length} chars)` : "NOT SET")
      console.error("  - GCS_CREDENTIALS:", process.env.GCS_CREDENTIALS ? `Set (${process.env.GCS_CREDENTIALS.length} chars)` : "NOT SET")
      console.error("  - GCS_KEY_FILENAME:", process.env.GCS_KEY_FILENAME ? `Set (${process.env.GCS_KEY_FILENAME})` : "NOT SET")
      
      // Check for specific error types
      if (gcsError?.message?.includes("Invalid JWT Signature") || 
          gcsError?.error === "invalid_grant" ||
          gcsError?.code === "invalid_grant") {
        console.error("")
        console.error("[ERROR TYPE] JWT Signature / Authentication Error")
        console.error("[CAUSE] GCS_CREDENTIALS private_key is likely malformed")
        console.error("[SOLUTION] Use base64 encoding for GCS_CREDENTIALS or ensure newlines are properly escaped")
        console.error("[DOCS] See docs/setup/google-cloud-storage.md for setup instructions")
        
        // Try to parse and validate credentials if they exist
        if (process.env.GCS_CREDENTIALS) {
          try {
            let credsStr = process.env.GCS_CREDENTIALS.trim()
            let parsed: any = null
            
            // Try parsing as JSON
            try {
              parsed = JSON.parse(credsStr)
            } catch {
              // Try base64 decode
              try {
                const decoded = Buffer.from(credsStr, "base64").toString("utf8")
                parsed = JSON.parse(decoded)
              } catch {
                console.error("[DEBUG] GCS_CREDENTIALS is neither valid JSON nor base64")
              }
            }
            
            if (parsed) {
              console.error("[DEBUG] GCS_CREDENTIALS structure:")
              console.error("  - Has type:", !!parsed.type)
              console.error("  - Has project_id:", !!parsed.project_id)
              console.error("  - Has private_key:", !!parsed.private_key)
              console.error("  - Has client_email:", !!parsed.client_email)
              
              if (parsed.private_key) {
                const pk = parsed.private_key
                console.error("  - private_key length:", pk.length)
                console.error("  - Contains BEGIN PRIVATE KEY:", pk.includes("BEGIN PRIVATE KEY"))
                console.error("  - Contains END PRIVATE KEY:", pk.includes("END PRIVATE KEY"))
                console.error("  - Contains \\n (escaped):", pk.includes("\\n"))
                console.error("  - Contains actual newline:", pk.includes("\n"))
                console.error("  - Contains \\\\n (double-escaped):", pk.includes("\\\\n"))
              }
            }
          } catch (parseError) {
            console.error("[DEBUG] Failed to parse GCS_CREDENTIALS for validation:", parseError)
          }
        }
      } else if (gcsError?.code === 403 || gcsError?.status === 403) {
        console.error("")
        console.error("[ERROR TYPE] Permission Denied")
        console.error("[CAUSE] Service account lacks required permissions")
        console.error("[SOLUTION] Grant 'Storage Object Admin' role to the service account")
      } else if (gcsError?.code === 404 || gcsError?.status === 404) {
        console.error("")
        console.error("[ERROR TYPE] Bucket Not Found")
        console.error("[CAUSE] GCS bucket does not exist or is not accessible")
        console.error("[SOLUTION] Verify GCS_BUCKET_NAME is correct and bucket exists")
      } else if (gcsError?.message?.includes("No Google Cloud Storage credentials")) {
        console.error("")
        console.error("[ERROR TYPE] Missing Credentials")
        console.error("[CAUSE] Neither GCS_CREDENTIALS nor GCS_KEY_FILENAME is set")
        console.error("[SOLUTION] Set GCS_CREDENTIALS or GCS_KEY_FILENAME environment variable")
      } else {
        console.error("")
        console.error("[ERROR TYPE] Unknown/Other Error")
        console.error("[FULL ERROR OBJECT]:", JSON.stringify(gcsError, Object.getOwnPropertyNames(gcsError), 2))
      }
      
      console.error("")
      console.error("[DEBUG] Error stack:", gcsError?.stack || "No stack trace available")
      console.error("=".repeat(80))
      
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

