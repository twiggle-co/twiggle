"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { UploadCloud, FileText, X as CloseIcon, PlusIcon } from "lucide-react"

import type { TwiggleNode } from "../types"
import { useDraggableWindow } from "./hooks/useDraggableWindow"
import { PreviewWindow } from "./PreviewWindow"

export function TwiggleNodeCard({ id, data }: NodeProps<TwiggleNode>) {
  const [showPreview, setShowPreview] = useState(false)
  const [showConfirmRemove, setShowConfirmRemove] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [fileContent, setFileContent] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevShowPreviewRef = useRef(false)
  
  // Window management hook
  const {
    windowState,
    windowPosition,
    windowSize,
    isDragging,
    windowRef,
    titleBarRef,
    handleWindowDragStart,
    handleResizeStart,
    handleMaximize,
    resetWindow,
    initializeWindow,
  } = useDraggableWindow()

  const persistFile = useCallback(
    (file: File | null) => {
      if (!data.onFileChange) return
      if (file) {
        // Read file content for text files
        const isTextFile = file.type.startsWith("text/") || 
                          file.type === "application/json" ||
                          file.name.endsWith(".txt") ||
                          file.name.endsWith(".md") ||
                          file.name.endsWith(".js") ||
                          file.name.endsWith(".ts") ||
                          file.name.endsWith(".tsx") ||
                          file.name.endsWith(".jsx") ||
                          file.name.endsWith(".css") ||
                          file.name.endsWith(".html") ||
                          file.name.endsWith(".json")
        
        if (isTextFile) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const content = e.target?.result as string
            setFileContent(content || "")
            // Persist content with file metadata
            if (data.onFileChange) {
              data.onFileChange(id, {
                name: file.name,
                size: file.size,
                type: file.type,
                content: content || "",
              })
            }
          }
          reader.onerror = () => {
            const errorMsg = "Error reading file"
            setFileContent(errorMsg)
            if (data.onFileChange) {
              data.onFileChange(id, {
                name: file.name,
                size: file.size,
                type: file.type,
                content: errorMsg,
              })
            }
          }
          reader.readAsText(file)
        } else {
          const notAvailableMsg = "Preview not available for this file type"
          setFileContent(notAvailableMsg)
          if (data.onFileChange) {
            data.onFileChange(id, {
              name: file.name,
              size: file.size,
              type: file.type,
              content: notAvailableMsg,
            })
          }
        }
      } else {
        data.onFileChange(id, null)
        setShowPreview(false)
        setFileContent("")
      }
    },
    [data, id]
  )

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    persistFile(file)
    event.target.value = ""
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const file = event.dataTransfer.files?.[0] ?? null
    persistFile(file)
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const fileInfo = data.file

  const triggerRemoveNode = () => {
    if (!data.onRemove) return
    data.onRemove(id)
    setShowConfirmRemove(false)
  }

  // Load file content from fileInfo when available
  useEffect(() => {
    if (fileInfo?.content !== undefined) {
      setFileContent(fileInfo.content)
    } else if (fileInfo && !fileInfo.content) {
      // File exists but no content loaded yet
      setFileContent("")
    }
  }, [fileInfo])

  // Initialize window when preview opens
  useEffect(() => {
    initializeWindow(showPreview, prevShowPreviewRef.current)
    prevShowPreviewRef.current = showPreview
  }, [showPreview, initializeWindow])

  const renderActionButtons = (className: string) => (
    <div className={`nodrag flex gap-2 ${className}`}>
      <button
        type="button"
        className="h-4 w-4 rounded-full bg-[#FFBD2E] shadow-sm hover:brightness-110 transition-all flex items-center justify-center"
        onClick={(event) => {
          event.stopPropagation()
          // setIsMinimized((prev) => !prev)
          setShowPreview(false)
        }}
        aria-label={isMinimized ? "Restore node" : "Minimize node"}
      >
        <span className="block h-0.5 w-2 bg-white/90 rounded-full" />
      </button>
      <button
        type="button"
        className="h-4 w-4 rounded-full bg-[#FF5F56] shadow-sm hover:brightness-160 transition-all flex items-center justify-center"
        onClick={(event) => {
          event.stopPropagation()
          setShowConfirmRemove(true)
        }}
        aria-label="Remove node"
      >
        <span className="relative block h-2.5 w-2.5">
          <span className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 rotate-45 bg-white/90 rounded-sm" />
          <span className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 -rotate-45 bg-white/90 rounded-sm" />
        </span>
        <span className="sr-only">Remove node</span>
      </button>
    </div>
  )

  return (
    <div
      className={`relative w-60 bg-white rounded-[28px] shadow-[0_15px_35px_rgba(19,45,70,0.15)] border border-[#D5DEEE] px-5 ${
        isMinimized ? "py-3" : "py-5"
      }`}
    >
      {isMinimized ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-gray-700 truncate">{data.label}</span>
          {!showConfirmRemove && renderActionButtons("items-center")}
        </div>
      ) : (
        <>
          {!showConfirmRemove && renderActionButtons("absolute top-3 right-5")}

          {data.kind === "file" && !showConfirmRemove && (
            <div className="text-xs font-semibold uppercase tracking-[0.4em] text-[#6B7C92] mb-3">
              File
            </div>
          )}

          {data.kind === "agent" && !showConfirmRemove && (
            <div className="text-xs font-semibold uppercase tracking-[0.4em] text-[#6B7C92] mb-3">
              Tool
            </div>
          )}

          {data.kind === "file" && !fileInfo && !showConfirmRemove && (
            <div
              className="nodrag rounded-2xl text-center bg-[#F8FBFF]"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <UploadCloud className="mx-auto h-12 w-12 text-[#7BA4F4]" />
              <p className="text-[11px] mt-2 text-sm text-gray-600">Select your file or drag and drop</p>
              <p className="text-[9px] text-gray-400">png, pdf, jpg, docx accepted</p>
              <button
                type="button"
                className="nodrag mt-2 inline-flex items-center justify-center rounded-full bg-[#7BA4F4] px-10 py-2 text-white text-sm font-semibold shadow"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse
              </button>
            </div>
          )}

          {data.kind === "file" && fileInfo && !showConfirmRemove && (
            <div className="nodrag relative">
              <div
                className="flex items-center gap-4 border border-[#C4CEDC] rounded-2xl px-4 py-3 bg-white cursor-pointer"
                onClick={() => setShowPreview((prev) => !prev)}
              >
                <div className="h-12 w-12 bg-[#EEF1FA] rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-[#7BA4F4]" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-gray-700 truncate">{fileInfo.name}</div>
                  <div className="text-xs text-gray-400">
                    {(fileInfo.size / 1024).toFixed(1)} KB 
                    {/* · {fileInfo.type || "Unknown"} */}
                  </div>
                </div>
                <button
                  type="button"
                  className="nodrag text-gray-400 hover:text-red-500"
                  onClick={(event) => {
                    event.stopPropagation()
                    persistFile(null)
                  }}
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>

              {showPreview && !showConfirmRemove && (
                <PreviewWindow
                  isOpen={showPreview}
                  fileName={fileInfo.name}
                  fileContent={fileContent}
                  onContentChange={(newContent) => {
                    setFileContent(newContent)
                    if (fileInfo && data.onFileChange) {
                      data.onFileChange(id, {
                        ...fileInfo,
                        content: newContent,
                      })
                    }
                  }}
                  onClose={() => setShowPreview(false)}
                  windowState={windowState}
                  windowPosition={windowPosition}
                  windowSize={windowSize}
                  isDragging={isDragging}
                  windowRef={windowRef}
                  titleBarRef={titleBarRef}
                  onDragStart={handleWindowDragStart}
                  onResizeStart={handleResizeStart}
                  onMaximize={handleMaximize}
                  onReset={resetWindow}
                />
              )}
            </div>
          )}

          {data.kind === "agent" && !showConfirmRemove && (
            <div className="text-[11px] text-sm text-gray-600">
              Agents will live here. Configure models, context and automations.
            </div>
          )}
        </>
      )}

      {data.kind !== "file" && ( 
        <Handle type="target" position={Position.Left} style={{width:'16px', height:'16px', background:'#7BA4F4'}} className="flex items-center justify-center cursor-pointer">
          <PlusIcon className="w-4 h-4 text-white" />
        </Handle>
      )}
      <Handle type="source" position={Position.Right} style={{width:'16px', height:'16px', background:'#7BA4F4'}} className="flex items-center justify-center cursor-pointer">
        <PlusIcon className="w-4 h-4 text-white" />
      </Handle>

      {/* <Handle type="source" position={Position.Right} className="w-12 h-12 bg-[#1B3B5F]" /> */}

      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
        className="hidden"
        onChange={handleInputChange}
      />

      {showConfirmRemove && (
        <div className="relative inset-0 rounded-[28px] bg-white/90 backdrop-blur-[2px] border border-[#F0F2F8] flex flex-col items-center justify-center text-center px-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">Remove this node?</p>
          <p className="text-xs text-gray-500 mb-4">
            Removing will also delete any connections attached to it.
          </p>
          <div className="nodrag flex gap-3 justify-center">
            <button
              type="button"
              className="px-4 py-2 rounded-full bg-gray-200 hover:brightness-90 text-gray-700 text-sm font-medium"
              onClick={() => setShowConfirmRemove(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-full bg-red-500 hover:brightness-180 text-white text-sm font-semibold shadow"
              onClick={triggerRemoveNode}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

