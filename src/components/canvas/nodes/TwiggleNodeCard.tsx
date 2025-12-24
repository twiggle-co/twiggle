"use client"

import { useState, useEffect, useRef } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"

import type { TwiggleNode, UploadedFileMeta } from "../types"
import { FileNode } from "./components/FileNode"

export function TwiggleNodeCard({ id, data }: NodeProps<TwiggleNode>) {
  const nodeType = data.nodeType || (id.split("-").slice(0, -1).join("-") as typeof data.nodeType)

  const [showOutline, setShowOutline] = useState(false)
  const [showActionButtons, setShowActionButtons] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const nodeRef = useRef<HTMLDivElement>(null)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)

  const fileInfo = data.file

  const handleFileRemove = async () => {
    if (!fileInfo?.fileId) return

    try {
      const response = await fetch(`/api/files/${fileInfo.fileId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Failed to delete file")
      }

      data.onRemove?.(id)
    } catch (error) {
      console.error("Error deleting file:", error)
      alert(error instanceof Error ? error.message : "Failed to delete file")
    }
  }

  const handleFilePreview = () => {
    if (fileInfo?.fileId) {
      // Cache-bust so browser/pdf viewer doesn't reuse the first response
      window.open(`/api/files/${fileInfo.fileId}?v=${Date.now()}`, "_blank")
    }
  }
  

  const handleOpenSource = () => {
    if (fileInfo?.sourceUrl) {
      window.open(fileInfo.sourceUrl, "_blank")
    }
  }

  const handleFileSync = async () => {
    if (!fileInfo?.fileId || isSyncing) return
    setIsSyncing(true)

    try {
      const response = await fetch(`/api/files/${fileInfo.fileId}/sync`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || error.message || "Failed to sync file")
      }

      const result = await response.json()

      const updatedMeta: UploadedFileMeta = {
        ...fileInfo,
        name: result.fileName ?? fileInfo.name,
        size: result.size ?? fileInfo.size,
        type: result.type ?? fileInfo.type,
        storageUrl: result.storageUrl ?? fileInfo.storageUrl,
        fileId: result.fileId ?? fileInfo.fileId,
        sourceType: result.sourceType ?? fileInfo.sourceType,
        sourceUrl: result.sourceUrl ?? fileInfo.sourceUrl,
        sourceDocId: result.sourceDocId ?? fileInfo.sourceDocId,
        sourceKind: result.sourceKind ?? fileInfo.sourceKind,
      }

      data.onFileChange?.(id, updatedMeta)
    } catch (error) {
      console.error("Sync error:", error)
      alert(error instanceof Error ? error.message : "Failed to sync file")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      dragStartPos.current = { x: e.clientX, y: e.clientY }

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (dragStartPos.current) {
          const distance = Math.sqrt(
            Math.pow(moveEvent.clientX - dragStartPos.current.x, 2) +
              Math.pow(moveEvent.clientY - dragStartPos.current.y, 2)
          )
          if (distance > 5) setIsDragging(true)
        }
      }

      const handleMouseUp = () => {
        dragStartPos.current = null
        setIsDragging(false)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      e.stopPropagation()
      setShowOutline(true)
      setShowActionButtons(true)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nodeRef.current && !nodeRef.current.contains(event.target as HTMLElement)) {
        setShowOutline(false)
        setShowActionButtons(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  if (!(data.kind === "file" && nodeType === "file-uploaded" && fileInfo)) {
    return null
  }

  return (
    <div
      ref={nodeRef}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className="hover:cursor-pointer"
    >
      <Handle type="target" position={Position.Left} />
      <FileNode
        file={fileInfo}
        showOutline={showOutline}
        showActionButtons={showActionButtons}
        isDragging={isDragging}
        onRemove={handleFileRemove}
        onPreview={handleFilePreview}
        onOpenSource={handleOpenSource}
        onSync={handleFileSync}
        isSyncing={isSyncing}
      />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
