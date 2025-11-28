"use client"

import { useSession } from "next-auth/react"
import { LoginButton } from "@/components/auth/LoginButton"
import Link from "next/link"

export default function DashboardPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your projects</h1>
          <LoginButton />
        </div>
      </div>
    )
  }

  // TODO: Fetch user's projects from API
  const projects = [
    { id: "abc123", name: "Project Alpha", updatedAt: "2025-01-15" },
    { id: "def456", name: "Project Beta", updatedAt: "2025-01-14" },
  ]

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Projects</h1>
          <Link
            href="/dashboard/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No projects yet</p>
            <Link
              href="/dashboard/new"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/leaflet/${project.id}`}
                className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              >
                <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
                <p className="text-sm text-gray-500">Updated {project.updatedAt}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

