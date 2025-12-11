"use client"

import { useCallback, useRef, useEffect } from "react"
import type { XYPosition } from "@xyflow/react"
import type { DragType } from "../nodeTemplates"
import { nodeTemplates } from "../nodeTemplates"
import type { TwiggleNode, UploadedFileMeta } from "../types"
import type { CanvasAddNodeDetail } from "@/lib/canvasActions"

import type { Edge } from "@xyflow/react"

interface UseCanvasNodesProps {
  projectId: string | null
  setNodes: React.Dispatch<React.SetStateAction<TwiggleNode[]>>
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
}

export function useCanvasNodes({
  projectId,
  setNodes,
  setEdges,
}: UseCanvasNodesProps) {
  const handleRemoveNode = useCallback(
    (nodeId: string) => {
      // Find node to check for associated files
      setNodes((prevNodes) => {
        const nodeToRemove = prevNodes.find((node) => node.id === nodeId)
        const fileId = nodeToRemove?.data?.file?.fileId

        if (fileId) {
          fetch(`/api/files/${fileId}`, { method: "DELETE" }).catch(() => {})
        }

        return prevNodes.filter((node) => node.id !== nodeId)
      })

      setEdges((prev) => prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    },
    [setNodes, setEdges]
  )

  const handleFileChangeRef = useRef<(nodeId: string, file: UploadedFileMeta | null) => void | undefined>(undefined)

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
                  projectId: projectId,
                  onFileChange: handleFileChangeRef.current || (() => {}),
                  onRemove: handleRemoveNode,
                },
              }
            : node
        )
      )
    },
    [setNodes, projectId, handleRemoveNode]
  )

  useEffect(() => {
    handleFileChangeRef.current = handleFileChange
  }, [handleFileChange])

  const addTwiggleNode = useCallback(
    (dragType: DragType, position: XYPosition, file?: UploadedFileMeta) => {
      const template = nodeTemplates[dragType]
      if (!template) return

      const newNode: TwiggleNode = {
        id: `${dragType}-${Date.now()}`,
        type: "twiggleNode",
        position,
        data: {
          ...template,
          file: file || null,
          projectId: projectId,
          onFileChange: handleFileChangeRef.current || handleFileChange,
          onRemove: handleRemoveNode,
        },
      }

      setNodes((prev) => prev.concat(newNode))
    },
    [projectId, handleFileChange, handleRemoveNode, setNodes]
  )

  const restoreNodeCallbacks = useCallback(
    (nodes: TwiggleNode[]): TwiggleNode[] => {
      return nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          projectId: projectId,
          onFileChange: handleFileChangeRef.current || handleFileChange,
          onRemove: handleRemoveNode,
        },
      }))
    },
    [projectId, handleFileChange, handleRemoveNode]
  )

  return {
    handleRemoveNode,
    handleFileChange,
    addTwiggleNode,
    restoreNodeCallbacks,
  }
}

