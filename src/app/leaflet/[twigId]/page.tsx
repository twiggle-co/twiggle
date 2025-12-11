"use client"

import { use, useEffect, useState } from "react"
import { LeafletTopNav, type ViewMode } from "@/components/navigation/LeafletTopNav"
import { NodeView } from "@/components/canvas/NodeView"
import { ChatPanel } from "@/components/canvas/ChatPanel"
import { ResizablePanels } from "@/components/canvas/ResizablePanels"
import type { TwiggleNode } from "@/components/canvas/types"

export default function LeafletPage({
  params,
}: {
  params: Promise<{ twigId: string }>
}) {
  const { twigId } = use(params)
  const [projectName, setProjectName] = useState("Loading...")
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("mixed")
  const [nodes, setNodes] = useState<TwiggleNode[]>([])

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${twigId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch project")
        }
        const project = await response.json()
        setProjectName(project.title || "Untitled Project")
      } catch {
        setProjectName("Project")
      }
    }

    if (twigId) {
      fetchProject()
    }
  }, [twigId])

  return (
    <div className="h-screen flex flex-col">
      <LeafletTopNav
        projectName={projectName}
        twigId={twigId}
        hasUnsavedChanges={hasUnsavedChanges}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      <div className="flex flex-1 overflow-hidden">
        <ResizablePanels
          leftPanel={
            <NodeView
              projectId={twigId}
              isLoadingWorkflow={isLoadingWorkflow}
              onUnsavedChangesChange={setHasUnsavedChanges}
              onLoadingChange={setIsLoadingWorkflow}
              onNodesChange={setNodes}
              className="h-full"
            />
          }
          rightPanel={<ChatPanel />}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>
    </div>
  )
}
