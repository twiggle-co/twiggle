"use client"

import { createPortal } from "react-dom"
import { X as CloseIcon, Maximize2, Minimize2 } from "lucide-react"
import type { UploadedFileMeta } from "../types"
import { colors } from "@/lib/colors"

type PreviewWindowProps = {
  isOpen: boolean
  fileName: string
  fileContent: string
  onContentChange: (content: string) => void
  onClose: () => void
  windowState: "normal" | "maximized" | "minimized"
  windowPosition: { x: number; y: number }
  windowSize: { width: number; height: number }
  isDragging: boolean
  windowRef: React.RefObject<HTMLDivElement | null>
  titleBarRef: React.RefObject<HTMLDivElement | null>
  onDragStart: (e: React.MouseEvent) => void
  onResizeStart: (e: React.MouseEvent, direction: string) => void
  onMaximize: () => void
  onReset: () => void
}

export function PreviewWindow({
  isOpen,
  fileName,
  fileContent,
  onContentChange,
  onClose,
  windowState,
  windowPosition,
  windowSize,
  isDragging,
  windowRef,
  titleBarRef,
  onDragStart,
  onResizeStart,
  onMaximize,
  onReset,
}: PreviewWindowProps) {
  if (!isOpen || typeof window === "undefined") return null

  return createPortal(
    <div
      ref={windowRef}
      className={`fixed bg-white border shadow-2xl z-[9999] ${
        windowState === "minimized" ? "h-12 overflow-hidden" : ""
      } ${windowState === "maximized" ? "rounded-none" : "rounded-3xl"}`}
      style={{
        borderColor: colors.gray + '80',
        left: `${windowPosition.x}px`,
        top: `${windowPosition.y}px`,
        width: `${windowSize.width}px`,
        height: windowState === "minimized" ? "48px" : `${windowSize.height}px`,
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      {/* Title Bar */}
      <div
        ref={titleBarRef}
        className={`flex items-center justify-between px-4 border-b ${
          windowState === "maximized" ? "rounded-none" : "rounded-t-3xl"
        } ${windowState === "minimized" ? "border-b-0" : ""}`}
        style={{ 
          borderColor: colors.gray + '60',
          backgroundColor: colors.background,
          cursor: windowState === "maximized" || windowState === "minimized" ? "default" : "grab",
          userSelect: "none",
        }}
        onMouseDown={onDragStart}
        onDoubleClick={(e) => {
          e.stopPropagation()
          onMaximize()
        }}
      >
        <div className="flex items-center gap-2 text-sm text-gray-600 flex-1 min-w-0">
          <span className="inline-flex gap-1 flex-shrink-0">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.secondary }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.warning }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.success }} />
          </span>
          <span className="font-medium truncate">{fileName}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            className="nodrag text-gray-400 hover:text-gray-600 p-1"
            onClick={(e) => {
              e.stopPropagation()
              onMaximize()
            }}
            title={windowState === "maximized" ? "Minimize" : "Maximize"}
          >
            {windowState === "maximized" ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            className="nodrag text-gray-400 p-1"
            style={{ color: 'inherit' }}
            onMouseEnter={(e) => e.currentTarget.style.color = colors.secondary}
            onMouseLeave={(e) => e.currentTarget.style.color = ''}
            onClick={(e) => {
              e.stopPropagation()
              onClose()
              onReset()
            }}
            title="Close"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Window Content */}
      {windowState !== "minimized" && (
        <div className="relative bg-white" style={{ height: `calc(100% - 48px)` }}>
          <textarea
            className="w-full h-full px-4 py-4 text-sm font-mono text-gray-800 bg-white border-0 resize-none focus:outline-none focus:ring-0 nodrag"
            value={fileContent}
            onChange={(e) => onContentChange(e.target.value)}
            style={{ 
              overflow: "auto",
              whiteSpace: "pre",
              wordWrap: "normal",
              tabSize: 2,
            }}
            spellCheck={false}
            placeholder="File content will appear here..."
          />
        </div>
      )}
      
      {/* Resize Handles */}
      {windowState === "normal" && (
        <>
          {/* Corner handles */}
          <div
            className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize z-10"
            onMouseDown={(e) => onResizeStart(e, "nw")}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize z-10"
            onMouseDown={(e) => onResizeStart(e, "ne")}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-10"
            onMouseDown={(e) => onResizeStart(e, "sw")}
          />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize z-10"
            onMouseDown={(e) => onResizeStart(e, "se")}
          />
          {/* Edge handles */}
          <div
            className="absolute top-0 left-3 right-3 h-1 cursor-ns-resize z-10"
            onMouseDown={(e) => onResizeStart(e, "n")}
          />
          <div
            className="absolute bottom-0 left-3 right-3 h-1 cursor-ns-resize z-10"
            onMouseDown={(e) => onResizeStart(e, "s")}
          />
          <div
            className="absolute left-0 top-3 bottom-3 w-1 cursor-ew-resize z-10"
            onMouseDown={(e) => onResizeStart(e, "w")}
          />
          <div
            className="absolute right-0 top-3 bottom-3 w-1 cursor-ew-resize z-10"
            onMouseDown={(e) => onResizeStart(e, "e")}
          />
        </>
      )}
    </div>,
    document.body
  )
}

