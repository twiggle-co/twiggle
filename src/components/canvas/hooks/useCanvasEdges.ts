"use client"

import { useCallback } from "react"
import { addEdge, type Connection, type Edge } from "@xyflow/react"

interface UseCanvasEdgesProps {
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
}

export function useCanvasEdges({ setEdges }: UseCanvasEdgesProps) {
  const onConnect = useCallback(
    (connection: Connection) => setEdges((prev) => addEdge(connection, prev)),
    [setEdges]
  )

  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      setEdges((prev) => prev.filter((edge) => !deletedEdges.some((deleted) => deleted.id === edge.id)))
    },
    [setEdges]
  )

  const onEdgeDoubleClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setEdges((prev) => prev.filter((e) => e.id !== edge.id))
    },
    [setEdges]
  )

  return {
    onConnect,
    onEdgesDelete,
    onEdgeDoubleClick,
  }
}

