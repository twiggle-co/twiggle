"use client"

import { useState, useRef } from "react"
import { X, Upload, Link as LinkIcon, FileText, Image, File } from "lucide-react"
import { requestCanvasNode } from "@/lib/canvasActions"
import { colors } from "@/lib/colors"
import type { UploadedFileMeta } from "../types"

interface FileUploadModalProps {
  isOpen: boolean
  onClose: () => void
  projectId?: string | null
  onFileUploaded?: (file: UploadedFileMeta) => void
}

export function FileUploadModal({ isOpen, onClose, projectId, onFileUploaded }: FileUploadModalProps) {
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file")
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const mouseDownRef = useRef<EventTarget | null>(null)

  if (!isOpen) return null

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      mouseDownRef.current = e.target
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    const selection = window.getSelection()
    const hasSelection = selection !== null && selection.toString().length > 0
    
    if (
      e.target === backdropRef.current &&
      mouseDownRef.current === backdropRef.current &&
      !hasSelection
    ) {
      onClose()
    }
    mouseDownRef.current = null
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const isValidFileType = (file: File): boolean => {
    const extension = file.name.split(".").pop()?.toLowerCase() || ""
    const validExtensions = [
      // PDF
      "pdf",
      // Documents
      "doc", "docx",
      // Excel/Sheets
      "xls", "xlsx", "csv",
      // PowerPoint
      "ppt", "pptx",
      // Images
      "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"
    ]
    return validExtensions.includes(extension)
  }

  const uploadFile = async (file: File) => {
    if (isUploading) return

    // Validate file type
    if (!isValidFileType(file)) {
      alert("Invalid file type. Please upload PDF, Document, Excel, PowerPoint, or Image files only.")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      if (projectId) {
        formData.append("projectId", projectId)
      }

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload file")
      }

      const result = await response.json()
      
      const fileMeta: UploadedFileMeta = {
        name: result.fileName,
        size: result.size,
        type: result.type,
        storageUrl: result.storageUrl,
        fileId: result.fileId,
      }

      // Add file node to canvas with file data
      requestCanvasNode("file-uploaded", fileMeta)
      
      // Notify parent component
      if (onFileUploaded) {
        onFileUploaded(fileMeta)
      }

      // Close modal after successful upload
      onClose()
    } catch (error) {
      console.error("Upload error:", error)
      alert(error instanceof Error ? error.message : "Failed to upload file")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      await uploadFile(files[0])
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await uploadFile(files[0])
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Handle URL upload
    console.log("URL submitted:", urlInput)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
    >
      <div ref={backdropRef} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      <div
        className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload a file or image</h2>

          {/* Upload Method Toggle */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setUploadMethod("file")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                uploadMethod === "file"
                  ? "text-gray-900 border-b-2 border-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload File
              </div>
            </button>
            <button
              onClick={() => setUploadMethod("url")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                uploadMethod === "url"
                  ? "text-gray-900 border-b-2 border-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                From URL
              </div>
            </button>
          </div>

          {uploadMethod === "file" ? (
            <>
              {/* File Icons Illustration */}
              <div className="mb-6 flex items-center justify-center">
                <div className="relative">
                  {/* Document stack illustration */}
                  <div className="relative w-32 h-32">
                    {/* Background documents */}
                    <div className="absolute top-2 left-2 w-20 h-24 bg-gray-200 rounded-sm transform rotate-[-5deg]"></div>
                    <div className="absolute top-4 left-4 w-20 h-24 bg-gray-300 rounded-sm transform rotate-[3deg]"></div>
                    
                    {/* Foreground documents with icons */}
                    <div className="absolute top-0 left-0 w-20 h-24 bg-white border-2 border-gray-300 rounded-sm shadow-md flex items-center justify-center">
                      <FileText className="h-8 w-8" style={{ color: colors.red }} />
                    </div>
                    <div className="absolute top-1 left-1 w-20 h-24 bg-gray-100 border border-gray-300 rounded-sm flex items-center justify-center">
                      <File className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="absolute top-2 left-2 w-20 h-24 bg-gray-200 border border-gray-300 rounded-sm flex items-center justify-center">
                      <Image className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Drag and Drop Area */}
              <div
                className="border-2 border-dashed rounded-lg p-12 text-center transition-colors mb-4"
                style={{
                  borderColor: isDragging ? colors.warning : colors.gray + "80",
                  backgroundColor: isDragging ? colors.warning + "15" : colors.gray + "40",
                }}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onMouseEnter={(e) => {
                  if (!isDragging) {
                    e.currentTarget.style.borderColor = colors.gray
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDragging) {
                    e.currentTarget.style.borderColor = colors.gray + "80"
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.ico"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Upload className="h-12 w-12 text-gray-400" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleBrowseClick}
                      disabled={isUploading}
                      className="inline-flex items-center justify-center px-6 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: colors.warning,
                      }}
                      onMouseEnter={(e) => {
                        if (!isUploading) {
                          e.currentTarget.style.backgroundColor = colors.yellowDark
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isUploading) {
                          e.currentTarget.style.backgroundColor = colors.warning
                        }
                      }}
                    >
                      {isUploading ? "Uploading..." : "Upload a file or image"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tip */}
              <p className="text-sm text-gray-500 text-center">
                Tip: the easiest way to upload a file is to drag it straight into a board.
              </p>
            </>
          ) : (
            <>
              {/* URL Upload Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter URL (Google Docs, Dropbox, etc.)
                  </label>
                  <form onSubmit={handleUrlSubmit}>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://docs.google.com/document/d/..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{
                          borderColor: colors.gray + "80",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = colors.warning
                          e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.warning}40`
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = colors.gray + "80"
                          e.currentTarget.style.boxShadow = ""
                        }}
                      />
                      <button
                        type="submit"
                        className="px-6 py-3 text-white rounded-lg font-medium transition-colors"
                        style={{
                          backgroundColor: colors.warning,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.yellowDark
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = colors.warning
                        }}
                      >
                        Upload
                      </button>
                    </div>
                  </form>
                </div>
                <p className="text-sm text-gray-500">
                  Paste a link to a file from Google Docs, Dropbox, or other cloud storage services.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

