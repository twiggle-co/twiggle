"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { PlusIcon } from "lucide-react"

import type { TwiggleNode } from "../types"
import { useDraggableWindow } from "../hooks/useDraggableWindow"
import { useFileOperations } from "../hooks/useFileOperations"
import { colors } from "@/lib/colors"
import { showFileWarning } from "@/lib/canvasActions"
import { NodeActionButtons } from "./components/NodeActionButtons"
import { RemoveConfirmDialog } from "./components/RemoveConfirmDialog"
import { FileUploadNode } from "./components/FileUploadNode"
import { FileCreateNode } from "./components/FileCreateNode"
import { FileOutputNode } from "./components/FileOutputNode"
import { FileInfoDisplay } from "./components/FileInfoDisplay"
import { AgentNode } from "./components/AgentNode"

export function TwiggleNodeCard({ id, data }: NodeProps<TwiggleNode>) {
  const nodeType = data.nodeType || (id.split("-").slice(0, -1).join("-") as typeof data.nodeType)

  const [showConfirmRemove, setShowConfirmRemove] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [fileContent, setFileContent] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fileName, setFileName] = useState(data.fileName || "")
  const [fileType, setFileType] = useState(data.fileType || "Markdown (.md)")

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

  const {
    isUploading,
    isLoadingContent,
    isCreating,
    isDeleting,
    fetchFileFromGCS,
    createFileInGCS,
    persistFile,
  } = useFileOperations({
    projectId: data.projectId,
    onFileChange: data.onFileChange,
    nodeId: id,
    setFileContent,
  })

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    if (file) {
      persistFile(file, fileInfo?.fileId)
    }
    event.target.value = ""
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const file = event.dataTransfer.files?.[0] ?? null
    if (file) {
      persistFile(file, fileInfo?.fileId)
    }
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

  const handleFileCreate = async () => {
    if (fileName.trim() && !isCreating) {
      try {
        const createResult = await createFileInGCS(fileName, fileType)

        const fileMeta = {
          name: createResult.fileName,
          size: createResult.size,
          type: createResult.type,
          storageUrl: createResult.storageUrl,
          fileId: createResult.fileId,
          content: "",
        }

        if (data.onFileChange) {
          data.onFileChange(id, fileMeta)
        }

        setFileContent("")
      } catch (error) {
        const errorMsg = `Error creating file: ${error instanceof Error ? error.message : "Unknown error"}`
        alert(errorMsg)
      }
    }
  }

  const handleContentChange = (newContent: string) => {
    setFileContent(newContent)
    if (fileInfo && data.onFileChange) {
      data.onFileChange(id, { ...fileInfo, content: newContent })
    }
  }

  return (
    <div
      className={`relative w-60 bg-white rounded-[28px] shadow-[0_15px_35px_rgba(19,45,70,0.15)] border px-5 ${
        isMinimized ? "py-3" : "py-5"
      }`}
      style={{ borderColor: colors.gray + "80" }}
    >
      {isMinimized ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-gray-700 truncate">{data.label}</span>
          {!showConfirmRemove && (
            <NodeActionButtons
              className="items-center"
              onMinimize={() => setIsMinimized(true)}
              onRemove={() => {
                if (fileInfo) {
                  showFileWarning()
                } else {
                  setShowConfirmRemove(true)
                }
              }}
              isMinimized={isMinimized}
              hasFile={!!fileInfo}
            />
          )}
        </div>
      ) : (
        <>
          {!showConfirmRemove && (
            <NodeActionButtons
              className="absolute top-3 right-5"
              onMinimize={() => setIsMinimized(true)}
              onRemove={() => {
                if (fileInfo) {
                  showFileWarning()
                } else {
                  setShowConfirmRemove(true)
                }
              }}
              hasFile={!!fileInfo}
            />
          )}

          {data.kind === "file" && !showConfirmRemove && (
            <div
              className="text-xs font-semibold uppercase tracking-[0.4em] mb-3"
              style={{ color: colors.darkGray + "CC" }}
            >
              File
            </div>
          )}

          {data.kind === "agent" && !showConfirmRemove && (
            <div
              className="text-xs font-semibold uppercase tracking-[0.4em] mb-3"
              style={{ color: colors.darkGray + "CC" }}
            >
              Tool
            </div>
          )}

          {data.kind === "file" && nodeType === "file-create" && !showConfirmRemove && (
            <FileCreateNode
              fileName={fileName}
              fileType={fileType}
              onFileNameChange={setFileName}
              onFileTypeChange={setFileType}
              onCreate={handleFileCreate}
              isCreating={isCreating}
            />
          )}

          {data.kind === "file" && nodeType === "file-output" && !showConfirmRemove && <FileOutputNode />}

          {data.kind === "file" &&
            (nodeType === "file-upload" || (!nodeType && !data.fileName)) &&
            !fileInfo &&
            !showConfirmRemove && (
              <FileUploadNode
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onBrowseClick={() => fileInputRef.current?.click()}
                isUploading={isUploading}
              />
            )}

          {data.kind === "file" && fileInfo && !showConfirmRemove && (
            <FileInfoDisplay
              fileInfo={fileInfo}
              showPreview={false}
              fileContent={fileContent}
              isLoadingContent={isLoadingContent}
              isDeleting={isDeleting}
              onRemoveFile={async () => {
                if (fileInfo.fileId) {
                  await persistFile(null, fileInfo.fileId)
                } else {
                  persistFile(null)
                }
              }}
              onContentChange={handleContentChange}
              onClosePreview={() => {}}
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

          {data.kind === "agent" && !showConfirmRemove && <AgentNode />}
        </>
      )}

      {(data.kind !== "file" || nodeType === "file-output") && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ width: "16px", height: "16px", background: colors.primary }}
          className="flex items-center justify-center cursor-pointer"
        >
          <PlusIcon className="w-4 h-4 text-white" />
        </Handle>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ width: "16px", height: "16px", background: colors.primary }}
        className="flex items-center justify-center cursor-pointer"
      >
        <PlusIcon className="w-4 h-4 text-white" />
      </Handle>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.json,.yaml,.yml,.html,.xml,.toml"
        className="hidden"
        onChange={handleInputChange}
      />

      {showConfirmRemove && (
        <RemoveConfirmDialog onConfirm={triggerRemoveNode} onCancel={() => setShowConfirmRemove(false)} />
      )}

    </div>
  )
}
