"use client"

import { colors } from "@/lib/colors"

interface NodeActionButtonsProps {
  className: string
  onMinimize: () => void
  onRemove: () => void
  isMinimized?: boolean
  hasFile?: boolean
}

export function NodeActionButtons({ className, onMinimize, onRemove, isMinimized, hasFile = false }: NodeActionButtonsProps) {
  const handleRemoveClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    onRemove()
  }

  return (
    <div className={`nodrag flex gap-2 ${className}`}>
      <button
        type="button"
        className="h-4 w-4 rounded-full shadow-sm hover:brightness-110 transition-all flex items-center justify-center"
        style={{ backgroundColor: colors.warning }}
        onClick={(event) => {
          event.stopPropagation()
        }}
        aria-label={isMinimized ? "Restore node" : "Minimize node"}
      >
        <span className="block h-0.5 w-2 bg-white/90 rounded-full" />
      </button>
      <button
        type="button"
        className={`h-4 w-4 rounded-full shadow-sm transition-all flex items-center justify-center ${
          hasFile ? "opacity-50" : "hover:brightness-110"
        }`}
        style={{ backgroundColor: colors.secondary }}
        onClick={handleRemoveClick}
        aria-label={hasFile ? "Cannot remove node with file. Please remove file first." : "Remove node"}
        title={hasFile ? "Please remove your file first before deleting a node" : "Remove node"}
      >
        <span className="relative block h-2.5 w-2.5">
          <span className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 rotate-45 bg-white/90 rounded-sm" />
          <span className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 -rotate-45 bg-white/90 rounded-sm" />
        </span>
        <span className="sr-only">Remove node</span>
      </button>
    </div>
  )
}

