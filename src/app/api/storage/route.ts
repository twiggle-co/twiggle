import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

const STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024 // 1GB in bytes

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Calculate file storage usage
    const files = await prisma.file.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        size: true,
      },
    })

    const fileStorageBytes = files.reduce((total, file) => {
      return total + Number(file.size)
    }, 0)

    // Calculate project descriptions storage (text length in bytes)
    const projects = await prisma.project.findMany({
      where: {
        ownerId: session.user.id,
      },
      select: {
        description: true,
        title: true,
      },
    })

    const projectStorageBytes = projects.reduce((total, project) => {
      const titleBytes = Buffer.byteLength(project.title, "utf8")
      const descBytes = project.description
        ? Buffer.byteLength(project.description, "utf8")
        : 0
      return total + titleBytes + descBytes
    }, 0)

    // Total storage used
    const totalStorageBytes = fileStorageBytes + projectStorageBytes
    const storagePercentage = (totalStorageBytes / STORAGE_LIMIT_BYTES) * 100

    return NextResponse.json({
      used: totalStorageBytes,
      limit: STORAGE_LIMIT_BYTES,
      percentage: Math.min(100, Number(storagePercentage.toFixed(2))), // Round to 2 decimal places (e.g., 45.67%)
      fileStorage: fileStorageBytes,
      projectStorage: projectStorageBytes,
    })
  } catch (error) {
    console.error("Error fetching storage usage:", error)
    return NextResponse.json(
      { error: "Failed to fetch storage usage" },
      { status: 500 }
    )
  }
}

