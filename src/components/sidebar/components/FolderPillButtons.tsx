"use client"

import { Eye, Plus } from "lucide-react"
import { colors, colorUtils } from "@/lib/colors"

interface FolderPillButtonsProps {
  folderButtonTop: number
  hoveredButton: "viewFiles" | "addFolder" | null
  onHoverButton: (button: "viewFiles" | "addFolder" | null) => void
  onViewFiles: () => void
  onAddFolder: () => void
}

export function FolderPillButtons({ 
  folderButtonTop, 
  hoveredButton, 
  onHoverButton,
  onViewFiles,
  onAddFolder 
}: FolderPillButtonsProps) {
  return (
    <div 
      className="pill-action-buttons absolute flex flex-col gap-2 z-10"
      style={{
        left: "88px", // 72px + 16px gap
        top: `${folderButtonTop+8}px`,
        transform: "translateY(0)",
      }}
    >
      <button
        className="flex items-center w-40 h-12 gap-3 px-5 py-1.5 bg-white rounded-full shadow-md border text-base font-medium"
        style={{
          borderColor: colors.warning,
          color: colors.darkGray,
          backgroundColor: hoveredButton === "viewFiles" ? colorUtils.lighten(colors.gray, 0.9) : "white",
          transform: hoveredButton === "viewFiles" ? "scale(1.05)" : hoveredButton === "addFolder" ? "scale(0.95)" : "scale(1)",
          transition: "all 0.2s ease-in-out",
        }}
        onMouseEnter={() => onHoverButton("viewFiles")}
        onMouseLeave={() => onHoverButton(null)}
        onClick={onViewFiles}
      >
        <Eye className="h-5 w-5" />
        View files
      </button>
      <button
        className="flex items-center h-12 gap-3 px-5 py-1.5 bg-white rounded-full shadow-md border text-base font-medium"
        style={{
          borderColor: colors.warning,
          color: colors.darkGray,
          backgroundColor: hoveredButton === "addFolder" ? colorUtils.lighten(colors.gray, 0.9) : "white",
          transform: hoveredButton === "addFolder" ? "scale(1.05)" : hoveredButton === "viewFiles" ? "scale(0.95)" : "scale(1)",
          transition: "all 0.2s ease-in-out",
        }}
        onMouseEnter={() => onHoverButton("addFolder")}
        onMouseLeave={() => onHoverButton(null)}
        onClick={onAddFolder}
      >
        <Plus className="h-5 w-5" />
        Add folder
      </button>
    </div>
  )
}

