"use client"

import { UploadCloud } from "lucide-react"
import { colors, colorUtils } from "@/lib/colors"

interface FileUploadNodeProps {
  onDrop: (event: React.DragEvent) => void
  onDragOver: (event: React.DragEvent) => void
  onBrowseClick: () => void
  isUploading: boolean
}

export function FileUploadNode({ onDrop, onDragOver, onBrowseClick, isUploading }: FileUploadNodeProps) {
  return (
    <div
      className="nodrag rounded-2xl text-center py-2"
      style={{ backgroundColor: colorUtils.lighten(colors.primary, 0.05) }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <UploadCloud className="mx-auto h-12 w-12" style={{ color: colors.primary }} />
      <p className="text-sm mt-1 text-gray-600">Select your file or drag and drop</p>
      {/* <p className="text-[9px] text-gray-400">PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, CSV, TXT, MD, JSON, YAML, HTML, XML, TOML</p> */}
      <button
        type="button"
        disabled={isUploading}
        className="nodrag mt-2 inline-flex items-center justify-center rounded-full px-10 py-2 text-white text-sm font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: colors.primary }}
        onClick={onBrowseClick}
      >
        {isUploading ? "Uploading..." : "Browse"}
      </button>
    </div>
  )
}

