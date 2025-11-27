"use client"

export type CanvasNodeKind = "file-upload" | "file-create" | "agent"

export type CanvasAddNodeDetail = {
  kind: CanvasNodeKind
}

export const CANVAS_ADD_NODE_EVENT = "twiggle:add-node"

export function requestCanvasNode(kind: CanvasNodeKind) {
  if (typeof window === "undefined") return

  window.dispatchEvent(
    new CustomEvent<CanvasAddNodeDetail>(CANVAS_ADD_NODE_EVENT, {
      detail: { kind },
    })
  )
}

