"use client"

import { Search, ChevronsLeft, ChevronsRight } from "lucide-react"
import { colors, colorUtils } from "@/lib/colors"

interface SidebarHeaderProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function SidebarHeader({ isCollapsed, onToggleCollapse }: SidebarHeaderProps) {
  return (
    <div 
      className={`${isCollapsed ? "p-1.5" : "p-2"} border-b bg-white`}
      style={{
        borderColor: colors.gray + "80",
      }}
    >
      <div className="flex items-center gap-1.5">
        {!isCollapsed && (
          <div className="relative flex-1">
            <input
              placeholder="Search"
              className="w-full pl-8 pr-3 py-2 rounded-lg text-sm focus:outline-none transition-colors"
              style={{
                backgroundColor: colorUtils.lighten(colors.gray, 0.9),
                borderColor: colors.gray + "80",
                color: colors.darkGray,
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = "white"
                e.currentTarget.style.borderColor = colors.gray
                e.currentTarget.style.boxShadow = `0 0 0 1px ${colors.gray}80`
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = colorUtils.lighten(colors.gray, 0.9)
                e.currentTarget.style.borderColor = colors.gray + "80"
                e.currentTarget.style.boxShadow = ""
              }}
            />
            <span 
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2"
              style={{ color: colors.darkGray + "80" }}
            >
              <Search className="h-5 w-5" />
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className={`${isCollapsed ? "w-full justify-center" : ""} flex items-center justify-center ${isCollapsed ? "p-1.5" : "p-2"} rounded-md transition-colors`}
          style={{
            color: colors.darkGray + "CC",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colorUtils.lighten(colors.gray, 0.8)
            e.currentTarget.style.color = colors.darkGray
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent"
            e.currentTarget.style.color = colors.darkGray + "CC"
          }}
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
  )
}

