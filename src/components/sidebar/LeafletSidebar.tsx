"use client"

import { useState } from "react"
import {
  Search,
  Upload,
  FilePlus2,
  FileOutput,
  Plus,
  ChevronDown,
  ChevronRight,
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
import { colors } from "@/lib/colors"

interface NodeItem {
  id: CanvasNodeKind
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface Category {
  id: string
  label: string
  nodes: NodeItem[]
}

const categories: Category[] = [
  {
    id: "files",
    label: "File",
    nodes: [
      { id: "file-upload", label: "Upload File", icon: Upload },
      { id: "file-create", label: "Create New File", icon: FilePlus2 },
      { id: "file-output", label: "Output File", icon: FileOutput },
    ],
  },
  {
    id: "agents",
    label: "Agents",
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
    label: "Utility",
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

interface CollapsibleCategoryProps {
  category: Category
  isOpen: boolean
  onToggle: () => void
}

function CollapsibleCategory({ category, isOpen, onToggle }: CollapsibleCategoryProps) {
  return (
    <div className="space-y-1.5">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 px-1.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
      >
        <span>{category.label}</span>
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="space-y-0.5 pl-1">
          {category.nodes.map((node) => {
            const Icon = node.icon
            return (
              <div key={node.id} className="flex items-center gap-1 group">
                <button
                  className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white cursor-move text-left transition-colors"
                  draggable
                  onDragStart={(e) => onDragStart(e, node.id)}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0 text-gray-600" />
                  <span className="text-xs text-gray-700">{node.label}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Add ${node.label} node`}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-gray-200 text-gray-600 transition-opacity"
                  onClick={() => onQuickAdd(node.id)}
                >
                  <Plus className="h-3.5 w-3.5" />
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
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())

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
    <div className="w-48 border-r border-gray-200 bg-white flex flex-col h-full">
      <div className="p-2 border-b border-gray-200 bg-white">
        <div className="relative">
          <input
            placeholder="Search"
            className="w-full pl-7 pr-2 py-1.5 rounded-lg text-xs focus:outline-none placeholder:text-gray-400 bg-gray-50 border border-gray-200 focus:bg-white focus:border-gray-300 focus:ring-1 focus:ring-gray-200 transition-colors"
          />
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
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
