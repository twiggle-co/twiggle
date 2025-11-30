"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type NodeTypes,
  type XYPosition,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { AlertCircle } from "lucide-react"
import {
  CANVAS_ADD_NODE_EVENT,
  type CanvasNodeKind,
  type CanvasAddNodeDetail,
} from "@/lib/canvasActions"
import { TwiggleNodeCard } from "./nodes/TwiggleNodeCard"
import type { UploadedFileMeta, TwiggleNode, TwiggleNodeData } from "./types"
import { colors, colorUtils } from "@/lib/colors"

type DragType = CanvasNodeKind

const nodeTemplates: Record<DragType, Pick<TwiggleNodeData, "label" | "kind" | "nodeType" | "detail">> = {
  // File Nodes
  "file-upload": {
    label: "Upload File",
    kind: "file",
    nodeType: "file-upload",
    detail: "Drop your files here",
  },
  "file-create": {
    label: "Create New File",
    kind: "file",
    nodeType: "file-create",
    detail: "Create empty files here",
  },
  "file-output": {
    label: "Output File",
    kind: "file",
    nodeType: "file-output",
    detail: "Output file destination",
  },
  // Agent / Tool Nodes
  summarize: {
    label: "Summarize",
    kind: "agent",
    nodeType: "summarize",
    detail: "Summarize content",
  },
  "outline-extractor": {
    label: "Outline Extractor",
    kind: "agent",
    nodeType: "outline-extractor",
    detail: "Extract outlines from documents",
  },
  "table-extractor": {
    label: "Table Extractor",
    kind: "agent",
    nodeType: "table-extractor",
    detail: "Extract tables from content",
  },
  "data-cleaner": {
    label: "Data Cleaner",
    kind: "agent",
    nodeType: "data-cleaner",
    detail: "Clean and normalize data",
  },
  "chart-generator": {
    label: "Chart Generator",
    kind: "agent",
    nodeType: "chart-generator",
    detail: "Generate charts from data",
  },
  "spreadsheet-writer": {
    label: "Spreadsheet Writer",
    kind: "agent",
    nodeType: "spreadsheet-writer",
    detail: "Write data to spreadsheets",
  },
  "report-writer": {
    label: "Report Writer",
    kind: "agent",
    nodeType: "report-writer",
    detail: "Generate reports",
  },
  "section-refiner": {
    label: "Section Refiner",
    kind: "agent",
    nodeType: "section-refiner",
    detail: "Refine document sections",
  },
  "slide-generator": {
    label: "Slide Generator",
    kind: "agent",
    nodeType: "slide-generator",
    detail: "Generate presentation slides",
  },
  "slide-design": {
    label: "Slide Design",
    kind: "agent",
    nodeType: "slide-design",
    detail: "Design presentation slides",
  },
  "email-draft": {
    label: "Email Draft",
    kind: "agent",
    nodeType: "email-draft",
    detail: "Draft email messages",
  },
  "follow-up-email": {
    label: "Follow-up Email",
    kind: "agent",
    nodeType: "follow-up-email",
    detail: "Generate follow-up emails",
  },
  // Utility / Config Nodes
  "prompt-template": {
    label: "Prompt Template",
    kind: "utility",
    nodeType: "prompt-template",
    detail: "Template for prompts",
  },
}

const nodeTypes: NodeTypes = { twiggleNode: TwiggleNodeCard }

// Autosave interval in milliseconds (30 seconds)
const AUTOSAVE_INTERVAL = 30000

interface InnerCanvasProps {
  projectId: string | null
  onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void
  onLoadingChange?: (isLoading: boolean) => void
}

function InnerCanvas({ projectId, onUnsavedChangesChange, onLoadingChange }: InnerCanvasProps) {
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null)
  const reactFlow = useReactFlow<TwiggleNode, Edge>()
  const [nodes, setNodes, onNodesChange] = useNodesState<TwiggleNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedHash, setLastSavedHash] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialLoadRef = useRef(true)

  const handleRemoveNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((node) => node.id !== nodeId))
      setEdges((prev) => prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    },
    [setEdges, setNodes]
  )

  const handleFileChange = useCallback(
    (nodeId: string, file: UploadedFileMeta | null) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  file,
                  projectId: projectId, // Preserve projectId
                  onFileChange: handleFileChange,
                  onRemove: handleRemoveNode,
                },
              }
            : node
        )
      )
    },
    [handleRemoveNode, setNodes, projectId]
  )

  // Sanitize nodes for serialization (remove callbacks and other non-serializable data)
  const sanitizeNodesForSave = useCallback((nodes: TwiggleNode[]) => {
    return nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: {
        label: n.data.label,
        kind: n.data.kind,
        nodeType: n.data.nodeType,
        detail: n.data.detail,
        file: n.data.file,
        fileName: n.data.fileName,
        fileType: n.data.fileType,
        projectId: n.data.projectId, // Keep projectId for reference
        // Explicitly omit: onFileChange, onRemove (callbacks cannot be serialized)
      },
    }))
  }, [])

  // Generate a hash of the current workflow state for change detection
  const generateWorkflowHash = useCallback((nodes: TwiggleNode[], edges: Edge[]): string => {
    const sanitizedNodes = sanitizeNodesForSave(nodes)
    const workflowString = JSON.stringify({
      nodes: sanitizedNodes,
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
    })
    // Simple hash function
    let hash = 0
    for (let i = 0; i < workflowString.length; i++) {
      const char = workflowString.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }, [sanitizeNodesForSave])

  // Load workflow from API
  const loadWorkflow = useCallback(async () => {
    if (!projectId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/workflow`)
      if (!response.ok) {
        throw new Error("Failed to load workflow")
      }

      const workflowData = await response.json()
      
      if (workflowData.nodes && workflowData.edges) {
        // Restore nodes with proper callbacks
        const restoredNodes: TwiggleNode[] = workflowData.nodes.map((node: any) => ({
          ...node,
          data: {
            ...node.data,
            projectId: projectId, // Ensure projectId is set on restored nodes
            onFileChange: handleFileChange,
            onRemove: handleRemoveNode,
          },
        }))

        setNodes(restoredNodes)
        setEdges(workflowData.edges || [])
        
        // Set initial hash
        const hash = generateWorkflowHash(restoredNodes, workflowData.edges || [])
        setLastSavedHash(hash)
        setHasUnsavedChanges(false)
      }
    } catch (error) {
      console.error("Error loading workflow:", error)
    } finally {
      setIsLoading(false)
      isInitialLoadRef.current = false
    }
  }, [projectId, handleFileChange, handleRemoveNode, setNodes, setEdges, generateWorkflowHash])

  // Notify parent when loading state changes
  useEffect(() => {
    onLoadingChange?.(isLoading)
  }, [isLoading, onLoadingChange])

  // Save workflow to API
  const saveWorkflow = useCallback(async (silent: boolean = false) => {
    if (!projectId) return

    if (!silent) {
      setIsSaving(true)
    }

    try {
      // Sanitize nodes before saving (remove callbacks)
      const sanitizedNodes = sanitizeNodesForSave(nodes)
      
      const response = await fetch(`/api/projects/${projectId}/workflow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodes: sanitizedNodes,
          edges,
          metadata: {},
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save workflow")
      }

      // Update saved hash
      const hash = generateWorkflowHash(nodes, edges)
      setLastSavedHash(hash)
      setHasUnsavedChanges(false)
      
      if (!silent) {
        console.log("Workflow saved successfully")
      }
    } catch (error) {
      console.error("Error saving workflow:", error)
      if (!silent) {
        alert(
          error instanceof Error
            ? error.message
            : "Failed to save workflow. Please try again."
        )
      }
    } finally {
      if (!silent) {
        setIsSaving(false)
      }
    }
  }, [projectId, nodes, edges, generateWorkflowHash, sanitizeNodesForSave])

  // Check for unsaved changes
  useEffect(() => {
    if (isInitialLoadRef.current) return

    const currentHash = generateWorkflowHash(nodes, edges)
    const hasChanges = currentHash !== lastSavedHash
    setHasUnsavedChanges(hasChanges)
    
    if (onUnsavedChangesChange) {
      onUnsavedChangesChange(hasChanges)
    }

    // Clear existing autosave timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
    }

    // Set up autosave if there are changes
    if (hasChanges && projectId) {
      autosaveTimerRef.current = setTimeout(() => {
        saveWorkflow(true) // Silent autosave
      }, AUTOSAVE_INTERVAL)
    }

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [nodes, edges, lastSavedHash, generateWorkflowHash, projectId, saveWorkflow, onUnsavedChangesChange])

  // Load workflow on mount
  useEffect(() => {
    if (projectId) {
      loadWorkflow()
    }

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [projectId, loadWorkflow])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
        return ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Expose save function globally for manual save
  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).saveWorkflow = () => saveWorkflow(false)
    }
  }, [saveWorkflow])

  const onConnect = useCallback(
    (connection: Connection) => setEdges((prev) => addEdge(connection, prev)),
    []
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const addTwiggleNode = useCallback(
    (dragType: DragType, position: XYPosition) => {
      const template = nodeTemplates[dragType]
      if (!template) return
      const newNode: TwiggleNode = {
        id: `${dragType}-${Date.now()}`,
        type: "twiggleNode",
        position,
        data: {
          ...template,
          file: null,
          projectId: projectId,
          onFileChange: handleFileChange,
          onRemove: handleRemoveNode,
        },
      }

      setNodes((prev) => prev.concat(newNode))
    },
    [handleFileChange, handleRemoveNode, setNodes]
  )

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const dragType = event.dataTransfer.getData("application/reactflow") as DragType
      if (!dragType || !reactFlowWrapperRef.current) return

      const position = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      addTwiggleNode(dragType, position)
    },
    [addTwiggleNode, reactFlow]
  )

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

  // ReactFlow
  return (
    <div ref={reactFlowWrapperRef} className="flex-1 relative" style={{ backgroundColor: colors.background }}>
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
            borderWidth: '1px',
            borderStyle: 'solid',
            color: colors.warning + 'CC'
          }}
        >
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Unsaved changes</span>
        </div>
      )}
      <ReactFlow<TwiggleNode, Edge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
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
}

export function NodeCanvas({ projectId = null, onUnsavedChangesChange, onLoadingChange }: NodeCanvasProps) {
  return (
    <ReactFlowProvider>
      <InnerCanvas 
        projectId={projectId} 
        onUnsavedChangesChange={onUnsavedChangesChange}
        onLoadingChange={onLoadingChange}
      />
    </ReactFlowProvider>
  )
}