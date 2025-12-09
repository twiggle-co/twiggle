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
  ChevronsLeft,
  ChevronsRight,
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
  Folder,
  Bot,
  Settings,
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
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  hoverBgColor: string
  nodes: NodeItem[]
}

const categories: Category[] = [
  {
    id: "files",
    label: "File",
    icon: Folder,
    iconColor: "text-blue-600",
    hoverBgColor: "#82a6f4", // blue-600 darker
    nodes: [
      { id: "file-upload", label: "Upload File", icon: Upload },
      { id: "file-create", label: "Create New File", icon: FilePlus2 },
      { id: "file-output", label: "Output File", icon: FileOutput },
    ],
  },
  {
    id: "agents",
    label: "Agents",
    icon: Bot,
    iconColor: "text-purple-600",
    hoverBgColor: "#e782f4", // purple-600 darker
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
    icon: Settings,
    iconColor: "text-orange-600",
    hoverBgColor: "#ebad25", // orange-600 darker
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

interface NodeButtonProps {
  node: NodeItem
  hoverBgColor: string
  isCollapsed: boolean
}

function NodeButton({ node, hoverBgColor, isCollapsed }: NodeButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const Icon = node.icon

  if (isCollapsed) {
    return (
      <button
        className="w-full flex items-center justify-center px-2 py-1.5 rounded-md cursor-move transition-colors"
        style={{
          backgroundColor: isHovered ? hoverBgColor : "transparent",
        }}
        draggable
        onDragStart={(e) => onDragStart(e, node.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={node.label}
      >
        <span 
          style={{ 
            color: isHovered ? "white" : "#4b5563",
            transform: isHovered ? "scale(1.3)" : "scale(1)",
            transition: "all 0.2s ease-in-out"
          }}
        >
          <Icon className="h-3.5 w-3.5 transition-colors" />
        </span>
      </button>
    )
  }

  return (
    <button
      className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md cursor-move text-left transition-colors"
      style={{
        backgroundColor: isHovered ? hoverBgColor : "transparent",
      }}
      draggable
      onDragStart={(e) => onDragStart(e, node.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span 
        style={{ 
          color: isHovered ? "white" : "#4b5563",
          transform: isHovered ? "scale(1.3)" : "scale(1)",
          transition: "all 0.2s ease-in-out"
        }}
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0 transition-colors" />
      </span>
      <span className="text-xs transition-colors" style={{ color: isHovered ? "white" : "#374151" }}>
        {node.label}
      </span>
    </button>
  )
}

interface CollapsibleCategoryProps {
  category: Category
  isOpen: boolean
  onToggle: () => void
  isCollapsed: boolean
}

function CollapsibleCategory({ category, isOpen, onToggle, isCollapsed }: CollapsibleCategoryProps) {
  const CategoryIcon = category.icon

  if (isCollapsed) {
    return (
      <div className="space-y-1.5 border border-gray-200 rounded-lg">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center px-1.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
          title={category.label}
        >
          <CategoryIcon className={`h-4 w-4 ${category.iconColor}`} />
        </button>
        {isOpen && (
          <div className="space-y-0.5">
            {category.nodes.map((node) => (
              <NodeButton key={node.id} node={node} hoverBgColor={category.hoverBgColor} isCollapsed={true} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider px-1.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <CategoryIcon className={`h-3.5 w-3.5 ${category.iconColor}`} />
          <span className={category.iconColor}>{category.label}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="space-y-0.5 pl-1">
          {category.nodes.map((node) => (
            <div key={node.id} className="flex items-center gap-1 group">
              <NodeButton node={node} hoverBgColor={category.hoverBgColor} isCollapsed={false} />
              <button
                type="button"
                aria-label={`Add ${node.label} node`}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-gray-200 text-gray-600 transition-opacity"
                onClick={() => onQuickAdd(node.id)}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function LeafletSidebar() {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())
  const [isCollapsed, setIsCollapsed] = useState(false)

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
    <div className={`${isCollapsed ? "w-12" : "w-48"} border-r border-gray-200 bg-white flex flex-col h-full transition-all duration-200`}>
      <div className="p-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-1.5">
          {!isCollapsed && (
            <div className="relative flex-1">
              <input
                placeholder="Search"
                className="w-full pl-7 pr-2 py-1.5 rounded-lg text-xs focus:outline-none placeholder:text-gray-400 bg-gray-50 border border-gray-200 focus:bg-white focus:border-gray-300 focus:ring-1 focus:ring-gray-200 transition-colors"
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`${isCollapsed ? "w-full justify-center" : ""} flex items-center justify-center p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {categories.map((category) => (
          <CollapsibleCategory
            key={category.id}
            category={category}
            isOpen={openCategories.has(category.id)}
            onToggle={() => toggleCategory(category.id)}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>
    </div>
  )
}
