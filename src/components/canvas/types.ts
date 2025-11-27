"use client"

import type { Node } from "@xyflow/react"

export type UploadedFileMeta = {
  name: string
  size: number
  type: string
  content?: string
}

export type TwiggleNodeData = {
  label: string
  kind: "file" | "agent"
  detail: string
  file?: UploadedFileMeta | null
  onFileChange?: (nodeId: string, file: UploadedFileMeta | null) => void
  onRemove?: (nodeId: string) => void
}

export type TwiggleNode = Node<TwiggleNodeData, "twiggleNode">

