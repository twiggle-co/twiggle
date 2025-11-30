"use client"

import { useCallback } from "react"
import type { XYPosition } from "@xyflow/react"
import type { DragType } from "../nodeTemplates"
import { nodeTemplates } from "../nodeTemplates"
import type { TwiggleNode, UploadedFileMeta } from "../types"

interface UseCanvasNodesProps {
  projectId: string | null
  setNodes: React.Dispatch<React.SetStateAction<TwiggleNode[]>>
  setEdges: React.Dispatch<React.SetStateAction<any[]>>
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

        // Delete file asynchronously (fire and forget)
        if (fileId) {
          fetch(`/api/files/${fileId}`, { method: "DELETE" }).catch((error) => {
            console.error(`Error deleting file ${fileId}:`, error)
          })
        }

        return prevNodes.filter((node) => node.id !== nodeId)
      })

      // Remove connected edges
      setEdges((prev) => prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    },
    [setNodes, setEdges]
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
                  projectId: projectId,
                  onFileChange: handleFileChange,
                  onRemove: handleRemoveNode,
                },
              }
            : node
        )
      )
    },
    [setNodes, projectId, handleRemoveNode]
  )

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
    [projectId, handleFileChange, handleRemoveNode, setNodes]
  )

  // Restore nodes with callbacks when loading from API
  const restoreNodeCallbacks = useCallback(
    (nodes: TwiggleNode[]): TwiggleNode[] => {
      return nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          projectId: projectId,
          onFileChange: handleFileChange,
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

