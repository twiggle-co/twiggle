"use client"

import { useEffect } from "react"
import type { Edge } from "@xyflow/react"

interface UseCanvasKeyboardProps {
  edges: Edge[]
  onEdgesDelete: (deletedEdges: Edge[]) => void
}

export function useCanvasKeyboard({ edges, onEdgesDelete }: UseCanvasKeyboardProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Check if any edges are selected
        const selectedEdges = edges.filter((edge) => edge.selected)
        
        if (selectedEdges.length > 0) {
          event.preventDefault()
          event.stopPropagation()
          onEdgesDelete(selectedEdges)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true) // Use capture phase
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [edges, onEdgesDelete])
}

