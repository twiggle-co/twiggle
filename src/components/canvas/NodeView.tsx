"use client"

import { LeafletSidebar } from "@/components/sidebar/LeafletSidebar"
import { NodeCanvas } from "@/components/canvas/NodeCanvas"
import type { TwiggleNode } from "./types"

interface NodeViewProps {
  projectId: string
  isLoadingWorkflow: boolean
  onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void
  onLoadingChange?: (isLoading: boolean) => void
  onNodesChange?: (nodes: TwiggleNode[]) => void
  className?: string
}

export function NodeView({
  projectId,
  isLoadingWorkflow,
  onUnsavedChangesChange,
  onLoadingChange,
  onNodesChange,
  className,
}: NodeViewProps) {
  return (
    <div className={`flex flex-1 overflow-hidden ${className || ""}`}>
      {!isLoadingWorkflow && <LeafletSidebar />}
      <NodeCanvas
        projectId={projectId}
        onUnsavedChangesChange={onUnsavedChangesChange}
        onLoadingChange={onLoadingChange}
        onNodesChange={onNodesChange}
        className="flex-1"
      />
    </div>
  )
}

