"use client"

import type { Node } from "@xyflow/react"
import type { CanvasNodeKind } from "@/lib/canvasActions"

export type UploadedFileMeta = {
  name: string
  size: number
  type: string
  content?: string
  storageUrl?: string // URL to file in Google Cloud Storage
  fileId?: string // Unique identifier for the file in storage
}

export type TwiggleNodeData = {
  label: string
  kind: "file" | "utility"
  nodeType: CanvasNodeKind // Specific node type identifier
  detail: string
  file?: UploadedFileMeta | null
  projectId?: string | null // Project ID for organizing files in GCS
  onFileChange?: (nodeId: string, file: UploadedFileMeta | null) => void
  onRemove?: (nodeId: string) => void
}

export type TwiggleNode = Node<TwiggleNodeData, "twiggleNode">

