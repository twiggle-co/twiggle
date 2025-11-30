"use client"

import { useSession } from "next-auth/react"
import { LoginButton } from "@/components/auth/LoginButton"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ProjectCard } from "@/components/dashboard/ProjectCard"
import { Grid3x3, List, ChevronDown, Plus } from "lucide-react"

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeFilter, setActiveFilter] = useState("recently-viewed")

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
    } catch {
      setError("Failed to load projects. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Please sign in to view your projects</h1>
          <LoginButton />
        </div>
      </div>
    )
  }

  const filters = [
    { id: "recently-viewed", label: "Recently viewed" },
    { id: "shared-files", label: "Shared files" },
    { id: "shared-projects", label: "Shared projects" },
  ]

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Recents</h1>
            <Link
              href="/dashboard/new"
              className="flex items-center gap-2 px-4 py-2 bg-[#118ab2] text-white rounded-lg hover:bg-[#0F7CA0] transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Link>
          </div>

          <div className="flex items-center gap-1 mb-4">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter === filter.id
                    ? "bg-[#118ab2] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                All organizations
                <ChevronDown className="h-4 w-4" />
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                All files
                <ChevronDown className="h-4 w-4" />
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Last viewed
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-white rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "grid" ? "bg-[#118ab2] text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "list" ? "bg-[#118ab2] text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-[#ef476f]/10 border border-[#ef476f]/30 rounded-lg text-[#ef476f]">
            {error}
            <button
              onClick={fetchProjects}
              className="ml-2 underline hover:no-underline text-[#118ab2]"
            >
              Retry
            </button>
          </div>
        )}

        {projects.length === 0 && !error ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 mb-4">No projects yet</p>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#06d6a0] text-white rounded-lg hover:bg-[#05C090]"
            >
              <Plus className="h-4 w-4" />
              Create your first project
            </Link>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                : "space-y-2"
            }
          >
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                title={project.title}
                description={project.description}
                updatedAt={project.updatedAt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

