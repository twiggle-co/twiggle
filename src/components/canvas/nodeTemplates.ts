import type { CanvasNodeKind } from "@/lib/canvasActions"
import type { TwiggleNodeData } from "./types"

export type DragType = CanvasNodeKind

export const nodeTemplates: Record<DragType, Pick<TwiggleNodeData, "label" | "kind" | "nodeType" | "detail">> = {
  // File Nodes
  "file-upload": {
    label: "Upload File",
    kind: "file",
    nodeType: "file-upload",
    detail: "Drop your files here",
  },
  "file-create": {
    label: "Create New File",
    kind: "file",
    nodeType: "file-create",
    detail: "Create empty files here",
  },
  "file-output": {
    label: "Output File",
    kind: "file",
    nodeType: "file-output",
    detail: "Output file destination",
  },
  // Agent / Tool Nodes
  summarize: {
    label: "Summarize",
    kind: "agent",
    nodeType: "summarize",
    detail: "Summarize content",
  },
  "outline-extractor": {
    label: "Outline Extractor",
    kind: "agent",
    nodeType: "outline-extractor",
    detail: "Extract outlines from documents",
  },
  "table-extractor": {
    label: "Table Extractor",
    kind: "agent",
    nodeType: "table-extractor",
    detail: "Extract tables from content",
  },
  "data-cleaner": {
    label: "Data Cleaner",
    kind: "agent",
    nodeType: "data-cleaner",
    detail: "Clean and normalize data",
  },
  "chart-generator": {
    label: "Chart Generator",
    kind: "agent",
    nodeType: "chart-generator",
    detail: "Generate charts from data",
  },
  "spreadsheet-writer": {
    label: "Spreadsheet Writer",
    kind: "agent",
    nodeType: "spreadsheet-writer",
    detail: "Write data to spreadsheets",
  },
  "report-writer": {
    label: "Report Writer",
    kind: "agent",
    nodeType: "report-writer",
    detail: "Generate reports",
  },
  "section-refiner": {
    label: "Section Refiner",
    kind: "agent",
    nodeType: "section-refiner",
    detail: "Refine document sections",
  },
  "slide-generator": {
    label: "Slide Generator",
    kind: "agent",
    nodeType: "slide-generator",
    detail: "Generate presentation slides",
  },
  "slide-design": {
    label: "Slide Design",
    kind: "agent",
    nodeType: "slide-design",
    detail: "Design presentation slides",
  },
  "email-draft": {
    label: "Email Draft",
    kind: "agent",
    nodeType: "email-draft",
    detail: "Draft email messages",
  },
  "follow-up-email": {
    label: "Follow-up Email",
    kind: "agent",
    nodeType: "follow-up-email",
    detail: "Generate follow-up emails",
  },
  // Utility / Config Nodes
  "prompt-template": {
    label: "Prompt Template",
    kind: "utility",
    nodeType: "prompt-template",
    detail: "Template for prompts",
  },
}

