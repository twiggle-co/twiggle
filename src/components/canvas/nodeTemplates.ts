import type { CanvasNodeKind } from "@/lib/canvasActions"
import type { TwiggleNodeData } from "./types"

export type DragType = CanvasNodeKind

export const nodeTemplates: Record<DragType, Pick<TwiggleNodeData, "label" | "kind" | "nodeType" | "detail">> = {
  // File Nodes
  "file-uploaded": {
    label: "Uploaded File",
    kind: "file",
    nodeType: "file-uploaded",
    detail: "Uploaded file",
  },
  // Utility / Config Nodes
  "prompt-template": {
    label: "Prompt Template",
    kind: "utility",
    nodeType: "prompt-template",
    detail: "Template for prompts",
  },
}

