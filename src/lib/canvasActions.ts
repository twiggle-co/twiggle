"use client"

import type { UploadedFileMeta } from "@/components/canvas/types"

export type CanvasNodeKind =
  | "file-uploaded"
  | "prompt-template"

export type CanvasAddNodeDetail = {
  kind: CanvasNodeKind
  file?: UploadedFileMeta
}

export const CANVAS_ADD_NODE_EVENT = "twiggle:add-node"
export const CANVAS_FILE_WARNING_EVENT = "twiggle:file-warning"

export function requestCanvasNode(kind: CanvasNodeKind, file?: UploadedFileMeta) {
  if (typeof window === "undefined") return

  window.dispatchEvent(
    new CustomEvent<CanvasAddNodeDetail>(CANVAS_ADD_NODE_EVENT, {
      detail: { kind, file },
    })
  )
}

export function showFileWarning() {
  if (typeof window === "undefined") return

  window.dispatchEvent(
    new CustomEvent(CANVAS_FILE_WARNING_EVENT)
  )
}

