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

const nodeTemplates: Record<DragType, Pick<TwiggleNodeData, "label" | "kind" | "detail">> = {
  "file-upload": {
    label: "Uploaded File",
    kind: "file",
    detail: "Drop your files here",
  },
  "file-create": {
    label: "New File",
    kind: "file",
    detail: "Create empty files here",
  },
  agent: {
    label: "New Agent",
    kind: "agent",
    detail: "More model and tools",
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