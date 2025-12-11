"use client"

import { 
  FileText, 
  File, 
  Image as ImageIcon, 
  FileSpreadsheet,
  Presentation,
  Eye,
  X
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
    // PDF
    pdf: FileText,
    // Documents
    doc: FileText,
    docx: FileText,
    // Excel/Sheets
    xls: FileSpreadsheet,
    xlsx: FileSpreadsheet,
    csv: FileSpreadsheet,
    // PowerPoint
    ppt: Presentation,
    pptx: Presentation,
    // Images
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

export function FileNode({ file, showOutline = false, showActionButtons = false, isDragging = false, onRemove, onPreview }: FileNodeProps) {
  const extension = getFileExtension(file.name)
  const IconComponent = getFileIcon(extension)
  const iconColor = getFileIconColor(extension)
  const fileSize = formatFileSize(file.size)

  return (
    <div className={`flex flex-col items-center justify-center p-4 relative ${
      isDragging ? "cursor-grabbing" : "cursor-pointer"
    }`}>
      {/* Action buttons - shown on left click */}
      {showActionButtons && (
        <div className="absolute -top-20 flex flex-col gap-2 z-10">
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

      {/* File Icon on rounded square background */}
      <div 
        className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mb-2 shadow-sm transition-all"
        style={{
          ...(showOutline ? {
            outline: `2px solid ${colors.primary}`,
            outlineOffset: "2px",
          } : {})
        }}
      >
        <span style={{ color: iconColor }}>
          <IconComponent className="h-10 w-10" />
        </span>
      </div>

      {/* Filename */}
      <div className="text-sm font-medium text-gray-700 mb-1 text-center max-w-[180px] truncate" title={file.name}>
        {file.name}
      </div>

      {/* File size */}
      <div className="text-xs text-gray-500">
        {fileSize}
      </div>
    </div>
  )
}

