"use client"

import { FileText, X as CloseIcon } from "lucide-react"
import { colors, colorUtils } from "@/lib/colors"
import { PreviewWindow } from "../PreviewWindow"
import type { UploadedFileMeta } from "../../types"

interface FileInfoDisplayProps {
  fileInfo: UploadedFileMeta
  showPreview: boolean
  fileContent: string
  isLoadingContent: boolean
  isDeleting?: boolean
  onTogglePreview: () => void
  onRemoveFile: () => void
  onContentChange: (content: string) => void
  onClosePreview: () => void
  // Preview window props
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

export function FileInfoDisplay({
  fileInfo,
  showPreview,
  fileContent,
  isLoadingContent,
  isDeleting = false,
  onTogglePreview,
  onRemoveFile,
  onContentChange,
  onClosePreview,
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
}: FileInfoDisplayProps) {
  return (
    <div className="nodrag relative">
      <div
        className="flex items-center gap-4 border rounded-2xl px-4 py-3 bg-white cursor-pointer"
        style={{ borderColor: colors.gray + "80" }}
        onClick={onTogglePreview}
      >
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: colorUtils.lighten(colors.primary, 0.1) }}
        >
          <FileText className="h-6 w-6" style={{ color: colors.primary }} />
        </div>
        <div className="flex-1 text-left min-w-0 overflow-hidden">
          <div className="text-sm font-semibold text-gray-700 truncate" title={fileInfo.name}>
            {fileInfo.name}
          </div>
          <div className="text-xs text-gray-400">{(fileInfo.size / 1024).toFixed(1)} KB</div>
        </div>
        <button
          type="button"
          className="nodrag text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          onClick={(event) => {
            event.stopPropagation()
            if (!isDeleting) {
              onRemoveFile()
            }
          }}
          disabled={isDeleting}
          title={isDeleting ? "Deleting..." : "Remove file"}
        >
          <CloseIcon className={`h-4 w-4 ${isDeleting ? "animate-pulse" : ""}`} />
        </button>
      </div>

      {showPreview && (
        <PreviewWindow
          isOpen={showPreview}
          fileName={fileInfo.name}
          fileContent={isLoadingContent ? "Loading file from storage..." : fileContent}
          onContentChange={onContentChange}
          onClose={onClosePreview}
          windowState={windowState}
          windowPosition={windowPosition}
          windowSize={windowSize}
          isDragging={isDragging}
          windowRef={windowRef}
          titleBarRef={titleBarRef}
          onDragStart={onDragStart}
          onResizeStart={onResizeStart}
          onMaximize={onMaximize}
          onReset={onReset}
        />
      )}
    </div>
  )
}

