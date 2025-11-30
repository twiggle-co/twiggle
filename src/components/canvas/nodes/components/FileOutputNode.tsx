"use client"

import { FileText } from "lucide-react"
import { colors } from "@/lib/colors"

export function FileOutputNode() {
  return (
    <div className="nodrag text-center py-4">
      <FileText className="mx-auto h-12 w-12 mb-2" style={{ color: colors.primary }} />
      <p className="text-sm text-gray-600">Output File</p>
      <p className="text-xs text-gray-400 mt-1">Files will be saved here</p>
    </div>
  )
}

