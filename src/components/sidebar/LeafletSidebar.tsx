"use client"

import { useState } from "react"
import {
  Search,
  Upload,
  FilePlus2,
  FileOutput,
  Bot,
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  Table,
  Wand2,
  BarChart3,
  Table2 as Spreadsheet,
  FileCheck,
  PenTool,
  Presentation,
  Palette,
  Mail,
  MailCheck,
  Code2,
  Sparkles,
  List,
  Eraser,
} from "lucide-react"
import { DragEvent } from "react"
import { requestCanvasNode, type CanvasNodeKind } from "@/lib/canvasActions"

type NodeItem = {
  id: CanvasNodeKind
  label: string
  icon: React.ComponentType<{ className?: string }>
}

type Category = {
  id: string
  label: string
  nodes: NodeItem[]
}

const categories: Category[] = [
  {
    id: "files",
    label: "File Nodes",
    nodes: [
      { id: "file-upload", label: "Upload File", icon: Upload },
      { id: "file-create", label: "Create New File", icon: FilePlus2 },
      { id: "file-output", label: "Output File", icon: FileOutput },
    ],
  },
  {
    id: "agents",
    label: "Agent / Tool Nodes",
    nodes: [
      { id: "summarize", label: "Summarize", icon: Sparkles },
      { id: "outline-extractor", label: "Outline Extractor", icon: List },
      { id: "table-extractor", label: "Table Extractor", icon: Table },
      { id: "data-cleaner", label: "Data Cleaner", icon: Eraser },
      { id: "chart-generator", label: "Chart Generator", icon: BarChart3 },
      { id: "spreadsheet-writer", label: "Spreadsheet Writer", icon: Spreadsheet },
      { id: "report-writer", label: "Report Writer", icon: FileCheck },
      { id: "section-refiner", label: "Section Refiner", icon: PenTool },
      { id: "slide-generator", label: "Slide Generator", icon: Presentation },
      { id: "slide-design", label: "Slide Design", icon: Palette },
      { id: "email-draft", label: "Email Draft", icon: Mail },
      { id: "follow-up-email", label: "Follow-up Email", icon: MailCheck },
    ],
  },
  {
    id: "utility",
    label: "Utility / Config Nodes",
    nodes: [{ id: "prompt-template", label: "Prompt Template", icon: Code2 }],
  },
]

function onDragStart(event: DragEvent<HTMLButtonElement>, nodeType: CanvasNodeKind) {
  event.dataTransfer.setData("application/reactflow", nodeType)
  event.dataTransfer.effectAllowed = "move"
}

function onQuickAdd(nodeType: CanvasNodeKind) {
  requestCanvasNode(nodeType)
}

type CollapsibleCategoryProps = {
  category: Category
  isOpen: boolean
  onToggle: () => void
}

function CollapsibleCategory({ category, isOpen, onToggle }: CollapsibleCategoryProps) {
  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span>{category.label}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      {isOpen && (
        <div className="space-y-1 pl-2">
          {category.nodes.map((node) => {
            const Icon = node.icon
            return (
              <div key={node.id} className="flex items-center gap-2">
                <button
                  className="flex-1 flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white cursor-move text-left"
                  draggable
                  onDragStart={(e) => onDragStart(e, node.id)}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{node.label}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Add ${node.label} node`}
                  className="p-2 rounded-lg hover:bg-white text-gray-600"
                  onClick={() => onQuickAdd(node.id)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function LeafletSidebar() {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  )

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  return (
    <div className="w-64 bg-[#F7F2E9] border-r border-gray-200 p-4 flex flex-col gap-6">
      <div className="relative">
        <input
          placeholder="Search"
          className="w-full px-8 py-2 rounded-full bg-[#C9D9F8] shadow-sm text-sm focus:outline-none placeholder:text-gray-400"
        />
        <Search className="absolute left-3 top-[9px] h-4 w-4 text-gray-500" />
      </div>

      <div className="space-y-4 text-sm text-gray-700 overflow-y-auto flex-1">
        {categories.map((category) => (
          <CollapsibleCategory
            key={category.id}
            category={category}
            isOpen={openCategories.has(category.id)}
            onToggle={() => toggleCategory(category.id)}
          />
        ))}
      </div>
    </div>
  )
}

