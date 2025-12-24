"use client"

import {
  FileText,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  Eye,
  X,
  RefreshCcw,
  ExternalLink,
} from "lucide-react"
import { colors } from "@/lib/colors"
import type { UploadedFileMeta } from "../../types"

interface FileNodeProps {
  file: UploadedFileMeta
  showOutline?: boolean
  showActionButtons?: boolean
  isDragging?: boolean
  onRemove?: () => void
  onPreview?: () => void

  // Sync + open source
  onSync?: () => void
  isSyncing?: boolean
  onOpenSource?: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileExtension(filename: string): string {
  const parts = filename.split(".")
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ""
}

function getFileIcon(extension: string) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    pdf: FileText,
    doc: FileText,
    docx: FileText,
    xls: FileSpreadsheet,
    xlsx: FileSpreadsheet,
    csv: FileSpreadsheet,
    ppt: Presentation,
    pptx: Presentation,
    jpg: ImageIcon,
    jpeg: ImageIcon,
    png: ImageIcon,
    gif: ImageIcon,
    webp: ImageIcon,
    svg: ImageIcon,
    bmp: ImageIcon,
    ico: ImageIcon,
  }
  return iconMap[extension] || File
}

function getFileIconColor(extension: string): string {
  const colorMap: Record<string, string> = {
    pdf: colors.red,
    doc: colors.blue,
    docx: colors.blue,
    xls: colors.green,
    xlsx: colors.green,
    csv: colors.green,
    ppt: colors.warning,
    pptx: colors.warning,
    jpg: colors.primary,
    jpeg: colors.primary,
    png: colors.primary,
    gif: colors.primary,
    webp: colors.primary,
    svg: colors.primary,
    bmp: colors.primary,
    ico: colors.primary,
  }
  return colorMap[extension] || colors.darkGray
}

export function FileNode({
  file,
  showOutline = false,
  showActionButtons = false,
  isDragging = false,
  onRemove,
  onPreview,
  onSync,
  isSyncing = false,
  onOpenSource,
}: FileNodeProps) {
  const extension = getFileExtension(file.name)
  const IconComponent = getFileIcon(extension)
  const iconColor = getFileIconColor(extension)
  const fileSize = formatFileSize(file.size)

  const canSync = Boolean(file.fileId) && file.sourceType === "google-drive"
  const hasSourceUrl = Boolean(file.sourceUrl)

  return (
    <div
      className={`flex flex-col items-center justify-center p-4 relative ${
        isDragging ? "cursor-grabbing" : "cursor-pointer"
      }`}
    >
      {showActionButtons && (
        <div className="absolute -top-28 flex flex-col gap-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPreview?.()
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>

          {hasSourceUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenSource?.()
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </button>
          )}

          {canSync && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSync?.()
              }}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync"}
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove?.()
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-md border transition-colors text-xs font-medium"
            style={{
              borderColor: colors.gray + "80",
              color: colors.secondary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.secondary + "15"
              e.currentTarget.style.borderColor = colors.secondary + "80"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white"
              e.currentTarget.style.borderColor = colors.gray + "80"
            }}
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      )}

      <div
        className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mb-2 shadow-sm transition-all"
        style={
          showOutline
            ? {
                outline: `2px solid ${colors.primary}`,
                outlineOffset: "2px",
              }
            : {}
        }
      >
        <span style={{ color: iconColor }}>
          <IconComponent className="h-10 w-10" />
        </span>
      </div>

      <div
        className="text-sm font-medium text-gray-700 mb-1 text-center max-w-[180px] truncate"
        title={file.name}
      >
        {file.name}
      </div>

      <div className="text-xs text-gray-500">{fileSize}</div>
    </div>
  )
}
