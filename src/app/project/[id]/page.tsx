"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { LoginButton } from "@/components/auth/LoginButton"

interface Project {
  id: string
  title: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export default function ProjectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params?.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (status === "authenticated" && projectId) {
      fetchProject()
    }
  }, [status, projectId])

  useEffect(() => {
    if (project) {
      setHasChanges(
        title !== project.title || description !== (project.description || "")
      )
    }
  }, [title, description, project])

  const fetchProject = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Project not found")
        }
        throw new Error("Failed to fetch project")
      }
      const data = await response.json()
      setProject(data)
      setTitle(data.title)
      setDescription(data.description || "")
      setError(null)
    } catch (err) {
      console.error("Error fetching project:", err)
      setError(
        err instanceof Error ? err.message : "Failed to load project"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!project) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update project")
      }

      const updatedProject = await response.json()
      setProject(updatedProject)
      setHasChanges(false)
    } catch (err) {
      console.error("Error saving project:", err)
      alert(
        err instanceof Error
          ? err.message
          : "Failed to save project. Please try again."
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete project")
      }

      router.push("/dashboard")
    } catch (err) {
      console.error("Error deleting project:", err)
      alert("Failed to delete project. Please try again.")
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
          <h1 className="text-2xl font-bold mb-4">Please sign in to view this project</h1>
          <LoginButton />
        </div>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">{error}</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Dashboard
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Project Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project title..."
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project description..."
              />
            </div>

            <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
              <p>Created: {new Date(project.createdAt).toLocaleString()}</p>
              <p>Last updated: {new Date(project.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Project Content Area */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Project Content</h2>
          <p className="text-gray-500">
            This is where you can work on your project content. Add your
            project-specific components and functionality here.
          </p>
          {/* TODO: Add your project-specific content editor here */}
        </div>
      </div>
    </div>
  )
}

