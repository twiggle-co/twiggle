"use client"

import { useCallback, useEffect, useRef } from "react"
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
import {
  CANVAS_ADD_NODE_EVENT,
  type CanvasNodeKind,
  type CanvasAddNodeDetail,
} from "@/lib/canvasActions"
import { TwiggleNodeCard } from "./nodes/TwiggleNodeCard"
import type { UploadedFileMeta, TwiggleNode, TwiggleNodeData } from "./types"

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

function InnerCanvas() {
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null)
  const reactFlow = useReactFlow<TwiggleNode, Edge>()
  const [nodes, setNodes, onNodesChange] = useNodesState<TwiggleNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

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
                  onFileChange: handleFileChange,
                  onRemove: handleRemoveNode,
                },
              }
            : node
        )
      )
    },
    [handleRemoveNode, setNodes]
  )

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
    <div ref={reactFlowWrapperRef} className="flex-1 bg-[#C9D9F8]">
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

export function NodeCanvas() {
  return (
    <ReactFlowProvider>
      <InnerCanvas />
    </ReactFlowProvider>
  )
}