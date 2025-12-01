"use client"

export type CanvasNodeKind =
  | "file-upload"
  | "file-create"
  | "file-output"
  | "summarize"
  | "outline-extractor"
  | "table-extractor"
  | "data-cleaner"
  | "chart-generator"
  | "spreadsheet-writer"
  | "report-writer"
  | "section-refiner"
  | "slide-generator"
  | "slide-design"
  | "email-draft"
  | "follow-up-email"
  | "prompt-template"

export type CanvasAddNodeDetail = {
  kind: CanvasNodeKind
}

export const CANVAS_ADD_NODE_EVENT = "twiggle:add-node"
export const CANVAS_FILE_WARNING_EVENT = "twiggle:file-warning"

export function requestCanvasNode(kind: CanvasNodeKind) {
  if (typeof window === "undefined") return

  window.dispatchEvent(
    new CustomEvent<CanvasAddNodeDetail>(CANVAS_ADD_NODE_EVENT, {
      detail: { kind },
    })
  )
}

export function showFileWarning() {
  if (typeof window === "undefined") return

  window.dispatchEvent(
    new CustomEvent(CANVAS_FILE_WARNING_EVENT)
  )
}

