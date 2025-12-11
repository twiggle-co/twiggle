"use client"

import { useState } from "react"
import { colors, colorUtils } from "@/lib/colors"

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  isCollapsed: boolean
}

export function ActionButton({ icon: Icon, label, onClick, isCollapsed }: ActionButtonProps) {
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
          className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{
            backgroundColor: colorUtils.lighten(colors.gray, 0.8),
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
    <button
      className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: isHovered ? colorUtils.lighten(colors.gray, 0.8) : "transparent",
      }}
    >
      <span style={{ color: colors.darkGray + "CC" }}>
        <Icon className="h-5 w-5 flex-shrink-0 transition-colors" />
      </span>
      <span className="text-sm" style={{ color: colors.darkGray + "CC" }}>{label}</span>
    </button>
  )
}

