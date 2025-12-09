"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { AlertCircle } from "lucide-react"
import {
  CANVAS_ADD_NODE_EVENT,
  CANVAS_FILE_WARNING_EVENT,
  type CanvasAddNodeDetail,
} from "@/lib/canvasActions"
import { TwiggleNodeCard } from "./nodes/TwiggleNodeCard"
import type { TwiggleNode } from "./types"
import { colors, colorUtils } from "@/lib/colors"
import { useWorkflowPersistence } from "./hooks/useWorkflowPersistence"
import { useCanvasNodes } from "./hooks/useCanvasNodes"
import { useCanvasEdges } from "./hooks/useCanvasEdges"
import { useCanvasKeyboard } from "./hooks/useCanvasKeyboard"

const nodeTypes: NodeTypes = { twiggleNode: TwiggleNodeCard }

interface InnerCanvasProps {
  projectId: string | null
  onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void
  onLoadingChange?: (isLoading: boolean) => void
  onNodesChange?: (nodes: TwiggleNode[]) => void
  className?: string
}

function InnerCanvas({ projectId, onUnsavedChangesChange, onLoadingChange, onNodesChange: onNodesChangeCallback, className }: InnerCanvasProps) {
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null)
  const reactFlow = useReactFlow<TwiggleNode, Edge>()
  const [nodes, setNodes, onNodesChange] = useNodesState<TwiggleNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [showFileWarning, setShowFileWarning] = useState(false)

  const { handleRemoveNode, handleFileChange, addTwiggleNode, restoreNodeCallbacks } =
    useCanvasNodes({
      projectId,
      setNodes,
      setEdges,
    })

  const { onConnect, onEdgesDelete, onEdgeDoubleClick } = useCanvasEdges({ setEdges })

  const { isLoading, isSaving, hasUnsavedChanges, saveWorkflow, loadWorkflow } =
    useWorkflowPersistence({
      projectId,
      nodes,
      edges,
      setNodes,
      setEdges,
      restoreNodeCallbacks,
      onUnsavedChangesChange,
      onLoadingChange,
    })

  useCanvasKeyboard({ edges, onEdgesDelete })

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const dragType = event.dataTransfer.getData("application/reactflow")
    if (!dragType || !reactFlowWrapperRef.current) return

    const position = reactFlow.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })
    addTwiggleNode(dragType as any, position)
  }

  useEffect(() => {
    const handler = (event: Event) => {
      const { detail } = event as CustomEvent<CanvasAddNodeDetail>
      if (!detail || !reactFlowWrapperRef.current) return

      const bounds = reactFlowWrapperRef.current.getBoundingClientRect()
      const centerPosition = reactFlow.screenToFlowPosition({
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2,
      })

      addTwiggleNode(detail.kind, centerPosition)
    }

    window.addEventListener(CANVAS_ADD_NODE_EVENT, handler as EventListener)
    return () => window.removeEventListener(CANVAS_ADD_NODE_EVENT, handler as EventListener)
  }, [addTwiggleNode, reactFlow])

  useEffect(() => {
    let warningTimer: NodeJS.Timeout | null = null

    const handler = () => {
      setShowFileWarning(true)
      if (warningTimer) clearTimeout(warningTimer)
      warningTimer = setTimeout(() => setShowFileWarning(false), 4000)
    }

    window.addEventListener(CANVAS_FILE_WARNING_EVENT, handler)
    return () => {
      window.removeEventListener(CANVAS_FILE_WARNING_EVENT, handler)
      if (warningTimer) clearTimeout(warningTimer)
    }
  }, [])

  useEffect(() => {
    if (projectId) {
      loadWorkflow()
    }
  }, [projectId, loadWorkflow])

  useEffect(() => {
    onNodesChangeCallback?.(nodes)
  }, [nodes, onNodesChangeCallback])

  return (
    <div ref={reactFlowWrapperRef} className={`flex-1 relative ${className || ""}`} style={{ backgroundColor: colors.background }}>
      {isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white px-4 py-2 rounded-lg shadow-lg">
          <span className="text-sm text-gray-700">Loading workflow...</span>
        </div>
      )}
      {isSaving && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white px-4 py-2 rounded-lg shadow-lg">
          <span className="text-sm text-gray-700">Saving...</span>
        </div>
      )}
      {hasUnsavedChanges && !isSaving && (
        <div
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          style={{
            backgroundColor: colorUtils.lighten(colors.gray, 0.8),
            borderColor: colors.warning,
            borderWidth: "1px",
            borderStyle: "solid",
            color: colors.warning + "CC",
          }}
        >
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Unsaved changes</span>
        </div>
      )}
      {showFileWarning && (
        <div
          className="absolute left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          style={{
            top: hasUnsavedChanges && !isSaving ? "60px" : "16px",
            backgroundColor: colorUtils.lighten(colors.secondary, 0.15),
            borderColor: colors.secondary,
            borderWidth: "1px",
            borderStyle: "solid",
            color: colors.secondary + "CC",
          }}
        >
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Please remove your file first before deleting a node</span>
        </div>
      )}
      <ReactFlow<TwiggleNode, Edge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        defaultEdgeOptions={{ deletable: true, selectable: true }}
        deleteKeyCode={['Backspace', 'Delete']}
        defaultViewport={{ x: 0, y: 0, zoom: 1.2 }}
        minZoom={0.2}
        maxZoom={2}
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.3, maxZoom: 1.5 }}
      >
        <Background id="1" gap={20} color="#404040" variant={BackgroundVariant.Dots} />
        <Controls />
      </ReactFlow>
    </div>
  )
}

interface NodeCanvasProps {
  projectId?: string | null
  onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void
  onLoadingChange?: (isLoading: boolean) => void
  onNodesChange?: (nodes: TwiggleNode[]) => void
  className?: string
}

export function NodeCanvas({ 
  projectId = null, 
  onUnsavedChangesChange, 
  onLoadingChange,
  onNodesChange,
  className,
}: NodeCanvasProps) {
  return (
    <ReactFlowProvider>
      <InnerCanvas
        projectId={projectId}
        onUnsavedChangesChange={onUnsavedChangesChange}
        onLoadingChange={onLoadingChange}
        onNodesChange={onNodesChange}
        className={className}
      />
    </ReactFlowProvider>
  )
}
