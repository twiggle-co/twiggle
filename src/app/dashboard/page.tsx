"use client"

import { useSession } from "next-auth/react"
import { LoginButton } from "@/components/auth/LoginButton"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Project {
  id: string
  title: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated") {
      fetchProjects()
    }
  }, [status])

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/projects")
      if (!response.ok) {
        throw new Error("Failed to fetch projects")
      }
      const data = await response.json()
      setProjects(data)
      setError(null)
    } catch (err) {
      console.error("Error fetching projects:", err)
      setError("Failed to load projects. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

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

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button
              onClick={fetchProjects}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {projects.length === 0 && !error ? (
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
                href={`/project/${project.id}`}
                className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              >
                <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
                {project.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Updated {formatDate(project.updatedAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

