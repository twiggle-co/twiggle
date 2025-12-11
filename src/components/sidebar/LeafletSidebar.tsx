"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, FilePlus2, FolderClosed } from "lucide-react"
import { colors } from "@/lib/colors"
import { FileUploadModal } from "@/components/canvas/modals/FileUploadModal"
import { ActionButton } from "./components/ActionButton"
import { DraggableNode } from "./components/DraggableNode"
import { FolderPillButtons } from "./components/FolderPillButtons"
import { SidebarHeader } from "./components/SidebarHeader"

interface LeafletSidebarProps {
  projectId?: string | null
}

export function LeafletSidebar({ projectId }: LeafletSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isFolderSelected, setIsFolderSelected] = useState(false)
  const folderButtonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [folderButtonTop, setFolderButtonTop] = useState(0)
  const [hoveredButton, setHoveredButton] = useState<"viewFiles" | "addFolder" | null>(null)

  useEffect(() => {
    if (isFolderSelected && folderButtonRef.current && containerRef.current) {
      const buttonRect = folderButtonRef.current.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()
      setFolderButtonTop(buttonRect.top - containerRect.top)
    }
  }, [isFolderSelected, isCollapsed])

  // Close buttons when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isFolderSelected && folderButtonRef.current && !folderButtonRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement
        // Check if click is not on the pill buttons
        if (!target.closest('.pill-action-buttons')) {
          setIsFolderSelected(false)
        }
      }
    }

    if (isFolderSelected) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isFolderSelected])

  const handleFolderClick = () => {
    // Only show pill buttons when sidebar is collapsed
    if (isCollapsed) {
      setIsFolderSelected(!isFolderSelected)
      if (folderButtonRef.current && containerRef.current) {
        const buttonRect = folderButtonRef.current.getBoundingClientRect()
        const containerRect = containerRef.current.getBoundingClientRect()
        setFolderButtonTop(buttonRect.top - containerRect.top)
      }
    }
    // When not collapsed, do nothing
  }

  // Close buttons when sidebar expands
  useEffect(() => {
    if (!isCollapsed && isFolderSelected) {
      setIsFolderSelected(false)
    }
  }, [isCollapsed])

  const handleViewFiles = () => {
    // TODO: Implement view files functionality
    console.log("View files clicked")
  }

  const handleAddFolder = () => {
    // TODO: Implement add folder functionality
    console.log("Add folder clicked")
  }

  return (
    <div ref={containerRef} className="relative">
      <div 
        className={`${isCollapsed ? "w-[72px]" : "w-60"} border-r bg-white flex flex-col h-full transition-all duration-200`}
        style={{
          borderColor: colors.gray + "80",
        }}
      >
        <SidebarHeader 
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />

        <div className={`flex-1 overflow-y-auto ${isCollapsed ? "p-1.5" : "p-2"}`}>
          <ActionButton
            icon={Upload}
            label="Upload"
            onClick={() => setShowUploadModal(true)}
            isCollapsed={isCollapsed}
          />
          <ActionButton
            icon={FilePlus2}
            label="Create"
            onClick={() => {}} // No-op for now
            isCollapsed={isCollapsed}
          />
          <DraggableNode
            icon={FolderClosed}
            label="Folder"
            isCollapsed={isCollapsed}
            onClick={handleFolderClick}
            isSelected={isFolderSelected}
            buttonRef={folderButtonRef}
          />
        </div>

        <FileUploadModal 
          isOpen={showUploadModal} 
          onClose={() => setShowUploadModal(false)}
          projectId={projectId}
        />
      </div>

      {/* Pill Action Buttons - Only show when collapsed and folder is selected */}
      {isFolderSelected && isCollapsed && (
        <FolderPillButtons
          folderButtonTop={folderButtonTop}
          hoveredButton={hoveredButton}
          onHoverButton={setHoveredButton}
          onViewFiles={handleViewFiles}
          onAddFolder={handleAddFolder}
        />
      )}
    </div>
  )
}
