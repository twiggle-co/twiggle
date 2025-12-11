"use client"

import { useState } from "react"
import {
  Search,
  Upload,
  FilePlus2,
  ChevronsLeft,
  ChevronsRight,
  Folder,
} from "lucide-react"
import { FileUploadModal } from "@/components/canvas/modals/FileUploadModal"

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  isCollapsed: boolean
}

function ActionButton({ icon: Icon, label, onClick, isCollapsed }: ActionButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  if (isCollapsed) {
    return (
      <button
        className="w-full flex flex-col items-center gap-1.5 py-2 transition-all duration-200"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={label}
      >
        <div 
          className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center transition-all duration-200 ${
            isHovered ? "-translate-y-1 shadow-md" : ""
          }`}
        >
          <Icon className="h-6 w-6 text-gray-700 transition-colors" />
        </div>
        <span className={`text-xs text-gray-600 transition-all duration-200 ${
          isHovered ? "-translate-y-1" : ""
        }`}>{label}</span>
      </button>
    )
  }

  return (
    <button
      className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors hover:bg-gray-100"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Icon className="h-5 w-5 text-gray-600 flex-shrink-0 transition-colors" />
      <span className="text-sm text-gray-600">{label}</span>
    </button>
  )
}

interface DraggableNodeProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  isCollapsed: boolean
}

function DraggableNode({ icon: Icon, label, isCollapsed }: DraggableNodeProps) {
  const [isHovered, setIsHovered] = useState(false)

  if (isCollapsed) {
    return (
      <button
        className="w-full flex flex-col items-center gap-1.5 py-2 cursor-move transition-all duration-200"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={label}
        onClick={() => {}} // No-op for now
      >
        <div 
          className={`w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center transition-all duration-200 ${
            isHovered ? "-translate-y-1 shadow-md" : ""
          }`}
        >
          <Icon className="h-6 w-6 text-amber-700 transition-colors" />
        </div>
        <span className={`text-xs text-gray-600 transition-all duration-200 ${
          isHovered ? "-translate-y-1" : ""
        }`}>{label}</span>
      </button>
    )
  }

  return (
    <button
      className="w-full flex items-center gap-3 px-3 py-2 rounded-md cursor-move text-left transition-colors"
      style={{
        backgroundColor: isHovered ? "#e5e7eb" : "transparent",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {}} // No-op for now
    >
      <Icon className="h-5 w-5 text-gray-600 flex-shrink-0 transition-colors" />
      <span className="text-sm text-gray-600">{label}</span>
    </button>
  )
}

interface LeafletSidebarProps {
  projectId?: string | null
}

export function LeafletSidebar({ projectId }: LeafletSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  return (
    <div className={`${isCollapsed ? "w-[72px]" : "w-60"} border-r border-gray-200 bg-white flex flex-col h-full transition-all duration-200`}>
      <div className={`${isCollapsed ? "p-1.5" : "p-2"} border-b border-gray-200 bg-white`}>
        <div className="flex items-center gap-1.5">
          {!isCollapsed && (
            <div className="relative flex-1">
              <input
                placeholder="Search"
                className="w-full pl-8 pr-3 py-2 rounded-lg text-sm focus:outline-none placeholder:text-gray-400 bg-gray-50 border border-gray-200 focus:bg-white focus:border-gray-300 focus:ring-1 focus:ring-gray-200 transition-colors"
              />
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`${isCollapsed ? "w-full justify-center" : ""} flex items-center justify-center ${isCollapsed ? "p-1.5" : "p-2"} rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronsRight className="h-6 w-6" />
            ) : (
              <ChevronsLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

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
          icon={Folder}
          label="Folder"
          isCollapsed={isCollapsed}
        />
      </div>

      <FileUploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)}
        projectId={projectId}
      />
    </div>
  )
}
