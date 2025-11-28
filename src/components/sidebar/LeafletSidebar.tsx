"use client"

import { Search, Upload, FilePlus2, Bot, Plus } from "lucide-react"
import { DragEvent } from "react"
import { requestCanvasNode, type CanvasNodeKind } from "@/lib/canvasActions"

type DragType = "file-upload" | "file-create" | "agent"

function onDragStart(event: DragEvent<HTMLButtonElement>, nodeType: DragType) {
  event.dataTransfer.setData("application/reactflow", nodeType)
  event.dataTransfer.effectAllowed = "move"
}

function onQuickAdd(nodeType: CanvasNodeKind) {
  requestCanvasNode(nodeType)
}

export function LeafletSidebar() {
  return (
    <div className="w-64 bg-[#F7F2E9] border-r border-gray-200 p-4 flex flex-col gap-6">
      <div className="relative">
        <input
          placeholder="Search"
          className="w-full px-8 py-2 rounded-full bg-[#C9D9F8] shadow-sm text-sm focus:outline-none placeholder:text-gray-400"
        />
        <Search className="absolute left-3 top-[9px] h-4 w-4 text-gray-500" />
      </div>

      <div className="space-y-4 text-sm text-gray-700">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Files
          </div>

          <div className="flex items-center gap-2">
            <button
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white cursor-move"
              draggable
              onDragStart={(e) => onDragStart(e, "file-upload")}
            >
              <Upload className="h-4 w-4" />
              <span>Upload Files</span>
            </button>
            <button
              type="button"
              aria-label="Add uploaded file node"
              className="p-2 rounded-lg hover:bg-white text-gray-600"
              onClick={() => onQuickAdd("file-upload")}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white cursor-move"
              draggable
              onDragStart={(e) => onDragStart(e, "file-create")}
            >
              <FilePlus2 className="h-4 w-4" />
              <span>Create Files</span>
            </button>
            <button
              type="button"
              aria-label="Add new file node"
              className="p-2 rounded-lg hover:bg-white text-gray-600"
              onClick={() => onQuickAdd("file-create")}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Agents
          </div>

          <div className="flex items-center gap-2">
            <button
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white cursor-move"
              draggable
              onDragStart={(e) => onDragStart(e, "agent")}
            >
              <Bot className="h-4 w-4" />
              <span>Add Agent</span>
            </button>
            <button
              type="button"
              aria-label="Add agent node"
              className="p-2 rounded-lg hover:bg-white text-gray-600"
              onClick={() => onQuickAdd("agent")}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

