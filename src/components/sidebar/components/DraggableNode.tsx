"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { colors, colorUtils } from "@/lib/colors"

interface DraggableNodeProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  isCollapsed: boolean
  onClick?: () => void
  isSelected?: boolean
  buttonRef?: React.RefObject<HTMLButtonElement | null>
}

export function DraggableNode({ icon: Icon, label, isCollapsed, onClick, isSelected, buttonRef }: DraggableNodeProps) {
  const [isHovered, setIsHovered] = useState(false)

  if (isCollapsed) {
    return (
      <button
        ref={buttonRef}
        className="w-full flex flex-col items-center gap-1.5 py-2 cursor-move transition-all duration-200"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={label}
        onClick={onClick}
        style={{
          backgroundColor: "transparent",
        }}
      >
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{
            backgroundColor: colorUtils.lighten(colors.warning, 0.85),
            ...(isHovered ? { transform: "translateY(-4px)", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" } : {})
          }}
        >
          <span style={{ color: colors.darkGray }}>
            <Icon className="h-6 w-6 transition-colors" />
          </span>
        </div>
        <span 
          className="text-xs transition-all duration-200"
          style={{
            color: colors.darkGray + "CC",
            ...(isHovered ? { transform: "translateY(-4px)" } : {})
          }}
        >
          {label}
        </span>
      </button>
    )
  }

  return (
    <div className="w-full flex items-center gap-1 group">
      <div
        className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md transition-colors"
        style={{
          backgroundColor: isHovered ? colorUtils.lighten(colors.gray, 0.8) : "transparent",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          ref={buttonRef}
          className="flex-1 flex items-center gap-3 cursor-move text-left"
          onClick={onClick}
        >
          <span style={{ color: colors.darkGray + "CC" }}>
            <Icon className="h-5 w-5 flex-shrink-0 transition-colors" />
          </span>
          <span className="text-sm" style={{ color: colors.darkGray + "CC" }}>{label}</span>
        </button>
      </div>
      <button
        type="button"
        aria-label={`Add ${label} node`}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md transition-opacity flex-shrink-0"
        style={{
          color: colors.darkGray + "CC",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colorUtils.lighten(colors.gray, 0.8)
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent"
        }}
        onClick={(e) => {
          e.stopPropagation()
          // TODO: Implement add folder node functionality
          console.log("Add folder node clicked")
        }}
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  )
}

