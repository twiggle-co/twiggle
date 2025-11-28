"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LoginButton } from "@/components/auth/LoginButton"

export default function NewLeafletPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projectName, setProjectName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

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
          <h1 className="text-2xl font-bold mb-4">Please sign in to create a project</h1>
          <LoginButton />
        </div>
      </div>
    )
  }

  const handleCreate = async () => {
    if (!projectName.trim()) {
      alert("Please enter a project name")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: projectName.trim(),
          description: "",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create project")
      }

      const project = await response.json()
      router.push(`/project/${project.id}`)
    } catch (error) {
      console.error("Error creating project:", error)
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create project. Please try again."
      )
      setIsCreating(false)
    }
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Create New Project</h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreate()
                  }
                }}
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={handleCreate}
                disabled={isCreating || !projectName.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Creating..." : "Create Project"}
              </button>
              <button
                onClick={() => router.back()}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

