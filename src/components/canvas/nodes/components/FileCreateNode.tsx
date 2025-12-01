"use client"

import { ChevronDown } from "lucide-react"
import { colors } from "@/lib/colors"

interface FileCreateNodeProps {
  fileName: string
  fileType: string
  onFileNameChange: (value: string) => void
  onFileTypeChange: (value: string) => void
  onCreate: () => void
  isCreating: boolean
}

export function FileCreateNode({
  fileName,
  fileType,
  onFileNameChange,
  onFileTypeChange,
  onCreate,
  isCreating,
}: FileCreateNodeProps) {
  return (
    <div className="nodrag space-y-5 relative">
      <div className="relative">
        <input
          type="text"
          value={fileName}
          onChange={(e) => onFileNameChange(e.target.value)}
          placeholder="Enter file name"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#118ab2] focus:border-transparent transition-all text-sm shadow-sm hover:border-gray-400"
        />
      </div>

      <div className="relative">
        <select
          value={fileType}
          onChange={(e) => onFileTypeChange(e.target.value)}
          className="w-full px-4 py-2.5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white text-sm appearance-none cursor-pointer pr-10 shadow-sm hover:brightness-110 transition-all"
          style={{ backgroundColor: colors.primary }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}`
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = ""
          }}
        >
          <option value="Markdown (.md)">Markdown (.md)</option>
          <option value="Text (.txt)">Text (.txt)</option>
          <option value="JSON (.json)">JSON (.json)</option>
          <option value="CSV (.csv)">CSV (.csv)</option>
          <option value="YAML (.yaml)">YAML (.yaml)</option>
          <option value="HTML (.html)">HTML (.html)</option>
          <option value="XML (.xml)">XML (.xml)</option>
          <option value="TOML (.toml)">TOML (.toml)</option>
        </select>
        <ChevronDown className="absolute right-3 top-[0.8rem] w-4 h-4 text-white pointer-events-none" />
      </div>

      <div className="pt-1">
        <button
          type="button"
          className={`nodrag mx-auto flex items-center justify-center rounded-full px-8 py-2.5 text-white text-sm font-semibold shadow-md transition-all ${
            fileName.trim() ? "hover:shadow-lg active:scale-[0.98]" : "opacity-50 cursor-not-allowed"
          }`}
          style={{
            backgroundColor: fileName.trim() ? colors.primary : colors.primary,
          }}
          onMouseEnter={(e) => {
            if (fileName.trim()) {
              e.currentTarget.style.backgroundColor = colors.blueDark
            }
          }}
          onMouseLeave={(e) => {
            if (fileName.trim()) {
              e.currentTarget.style.backgroundColor = colors.primary
            }
          }}
          onClick={onCreate}
          disabled={!fileName.trim() || isCreating}
        >
          {isCreating ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  )
}

