"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type React from "react"
import type { Edge } from "@xyflow/react"
import type { TwiggleNode } from "../types"

const AUTOSAVE_INTERVAL = 30000

interface UseWorkflowPersistenceProps {
  projectId: string | null
  nodes: TwiggleNode[]
  edges: Edge[]
  setNodes: React.Dispatch<React.SetStateAction<TwiggleNode[]>>
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  restoreNodeCallbacks: (nodes: TwiggleNode[]) => TwiggleNode[]
  onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void
  onLoadingChange?: (isLoading: boolean) => void
}

export function useWorkflowPersistence({
  projectId,
  nodes,
  edges,
  setNodes,
  setEdges,
  restoreNodeCallbacks,
  onUnsavedChangesChange,
  onLoadingChange,
}: UseWorkflowPersistenceProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedHash, setLastSavedHash] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialLoadRef = useRef(true)

  // Sanitize nodes for serialization (remove callbacks and other non-serializable data)
  const sanitizeNodesForSave = useCallback((nodesToSanitize: TwiggleNode[]) => {
    return nodesToSanitize.map((n) => ({
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
        projectId: n.data.projectId,
        // Explicitly omit: onFileChange, onRemove (callbacks cannot be serialized)
      },
    }))
  }, [])

  // Generate a hash of the current workflow state for change detection
  const generateWorkflowHash = useCallback(
    (nodesToHash: TwiggleNode[], edgesToHash: Edge[]): string => {
      const sanitizedNodes = sanitizeNodesForSave(nodesToHash)
      const workflowString = JSON.stringify({
        nodes: sanitizedNodes,
        edges: edgesToHash.map((e) => ({
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
        hash = hash | 0 // Convert to 32-bit integer
      }
      return hash.toString()
    },
    [sanitizeNodesForSave]
  )

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
        const restoredNodes = restoreNodeCallbacks(
          (workflowData.nodes as TwiggleNode[]).map((node) => ({
            ...node,
            data: {
              ...node.data,
              projectId: projectId,
            },
          }))
        )

        setNodes(restoredNodes)
        // Restore edges with deletable property
        const restoredEdges = (workflowData.edges || []).map((edge: Edge) => ({
          ...edge,
          deletable: true,
          selectable: true,
        }))
        setEdges(restoredEdges)

        // Set initial hash
        const hash = generateWorkflowHash(restoredNodes, restoredEdges)
        setLastSavedHash(hash)
        setHasUnsavedChanges(false)
      }
    } catch {
      // Ignore errors during load
    } finally {
      setIsLoading(false)
      isInitialLoadRef.current = false
    }
  }, [projectId, restoreNodeCallbacks, setNodes, setEdges, generateWorkflowHash])

  const saveWorkflow = useCallback(
    async (silent: boolean = false) => {
      if (!projectId) return

      if (!silent) {
        setIsSaving(true)
      }

      try {
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
      } catch (error) {
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
    },
    [projectId, nodes, edges, generateWorkflowHash, sanitizeNodesForSave]
  )

  // Notify parent when loading state changes
  useEffect(() => {
    onLoadingChange?.(isLoading)
  }, [isLoading, onLoadingChange])

  // Check for unsaved changes and autosave
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
  }, [
    nodes,
    edges,
    lastSavedHash,
    generateWorkflowHash,
    projectId,
    saveWorkflow,
    onUnsavedChangesChange,
  ])

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
      interface WindowWithSaveWorkflow extends Window {
        saveWorkflow?: () => void
      }
      const win = window as WindowWithSaveWorkflow
      win.saveWorkflow = () => saveWorkflow(false)
    }
    return () => {
      if (typeof window !== "undefined") {
        interface WindowWithSaveWorkflow extends Window {
          saveWorkflow?: () => void
        }
        const win = window as WindowWithSaveWorkflow
        delete win.saveWorkflow
      }
    }
  }, [saveWorkflow])

  return {
    isLoading,
    isSaving,
    hasUnsavedChanges,
    saveWorkflow,
    loadWorkflow,
  }
}

