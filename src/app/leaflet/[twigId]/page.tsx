"use client"

import { use, useEffect, useState } from "react"
import { LeafletTopNav } from "@/components/navigation/LeafletTopNav"
import { LeafletSidebar } from "@/components/sidebar/LeafletSidebar"
import { NodeCanvas } from "@/components/canvas/NodeCanvas"

/**
 * Leaflet (project canvas) page
 */
export default function LeafletPage({
  params,
}: {
  params: Promise<{ twigId: string }>
}) {
  const { twigId } = use(params)
  const [projectName, setProjectName] = useState("Loading...")
  const [isLoading, setIsLoading] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${twigId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch project")
        }
        const project = await response.json()
        setProjectName(project.title || "Untitled Project")
      } catch (error) {
        console.error("Error fetching project:", error)
        setProjectName("Project")
      } finally {
        setIsLoading(false)
      }
    }

    if (twigId) {
      fetchProject()
    }
  }, [twigId])

  return (
    <div className="h-screen w-screen flex flex-col">
      <LeafletTopNav 
        projectName={projectName} 
        twigId={twigId}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      <div className="flex flex-1 overflow-hidden">
        <LeafletSidebar />
        <NodeCanvas 
          projectId={twigId} 
          onUnsavedChangesChange={setHasUnsavedChanges}
        />
      </div>
    </div>
  )
}
