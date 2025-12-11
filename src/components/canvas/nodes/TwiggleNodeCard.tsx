"use client"

import { useState, useEffect, useRef } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"

import type { TwiggleNode } from "../types"
import { FileNode } from "./components/FileNode"

export function TwiggleNodeCard({ id, data, selected }: NodeProps<TwiggleNode>) {
  const nodeType = data.nodeType || (id.split("-").slice(0, -1).join("-") as typeof data.nodeType)

  const [showOutline, setShowOutline] = useState(false)
  const [showActionButtons, setShowActionButtons] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
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
        const error = await response.json()
        throw new Error(error.error || "Failed to delete file")
      }

      // Remove the node from canvas
      if (data.onRemove) {
        data.onRemove(id)
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      alert(error instanceof Error ? error.message : "Failed to delete file")
    }
  }

  const handleFilePreview = () => {
    if (fileInfo?.fileId) {
      window.open(`/api/files/${fileInfo.fileId}`, "_blank")
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only track left mouse button for dragging
    if (e.button === 0) {
      dragStartPos.current = { x: e.clientX, y: e.clientY }
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (dragStartPos.current) {
          const distance = Math.sqrt(
            Math.pow(moveEvent.clientX - dragStartPos.current.x, 2) + 
            Math.pow(moveEvent.clientY - dragStartPos.current.y, 2)
          )
          // If moved more than 5px, consider it dragging
          if (distance > 5) {
            setIsDragging(true)
          }
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
    // Don't show outline if it was a drag
    if (!isDragging) {
      e.stopPropagation()
      // Left click - show outline and action buttons
      setShowOutline(true)
      setShowActionButtons(true)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // Hide outline and buttons when clicking outside the node
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nodeRef.current && !nodeRef.current.contains(event.target as HTMLElement)) {
        setShowOutline(false)
        setShowActionButtons(false)
      }
    }

    // Use click event to match the onClick behavior
    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [])

  // Only render file-uploaded nodes
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
      />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
