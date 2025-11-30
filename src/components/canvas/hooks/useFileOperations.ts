"use client"

import { useCallback, useState } from "react"
import type { UploadedFileMeta } from "../types"

interface UseFileOperationsProps {
  projectId?: string | null
  onFileChange?: (nodeId: string, file: UploadedFileMeta | null) => void
  nodeId: string
  setFileContent: (content: string) => void
}

export function useFileOperations({
  projectId,
  onFileChange,
  nodeId,
  setFileContent,
}: UseFileOperationsProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Upload file to Google Cloud Storage
  const uploadFileToGCS = useCallback(
    async (file: File) => {
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
          throw new Error("Failed to upload file")
        }

        const result = await response.json()
        return result
      } catch (error) {
        console.error("Error uploading file:", error)
        throw error
      } finally {
        setIsUploading(false)
      }
    },
    [projectId]
  )

  // Fetch file content from Google Cloud Storage
  const fetchFileFromGCS = useCallback(async (fileId: string) => {
    setIsLoadingContent(true)
    try {
      const response = await fetch(`/api/files/${fileId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch file")
      }

      const contentType = response.headers.get("content-type") || ""
      const isTextFile =
        contentType.startsWith("text/") ||
        contentType === "application/json" ||
        contentType.includes("javascript") ||
        contentType.includes("typescript")

      if (isTextFile) {
        const text = await response.text()
        return text
      } else {
        // For binary files, return a message
        return "Preview not available for this file type. File is stored in Google Cloud Storage."
      }
    } catch (error) {
      console.error("Error fetching file:", error)
      return `Error loading file: ${error instanceof Error ? error.message : "Unknown error"}`
    } finally {
      setIsLoadingContent(false)
    }
  }, [])

  // Create file in Google Cloud Storage
  const createFileInGCS = useCallback(
    async (fileName: string, fileType: string) => {
      setIsCreating(true)
      try {
        const response = await fetch("/api/files/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName,
            fileType,
            projectId: projectId || null,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to create file")
        }

        const result = await response.json()
        return result
      } catch (error) {
        console.error("Error creating file:", error)
        throw error
      } finally {
        setIsCreating(false)
      }
    },
    [projectId]
  )

  // Delete file from database and storage
  const deleteFile = useCallback(async (fileId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete file")
      }

      return true
    } catch (error) {
      console.error("Error deleting file:", error)
      throw error
    } finally {
      setIsDeleting(false)
    }
  }, [])

  // Persist file (upload and update node)
  const persistFile = useCallback(
    async (file: File | null, existingFileId?: string) => {
      if (!onFileChange) return
      if (file) {
        try {
          // Validate file type
          const allowedExtensions = [
            ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".csv",
            ".txt", ".md", ".json", ".yaml", ".yml", ".html", ".xml", ".toml"
          ]
          const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()

          if (!allowedExtensions.includes(fileExtension)) {
            throw new Error(`File type not allowed. Allowed types: ${allowedExtensions.join(", ")}`)
          }

          // If replacing an existing file, delete the old one first
          if (existingFileId) {
            try {
              await deleteFile(existingFileId)
            } catch (error) {
              console.error("Error deleting old file:", error)
              // Continue with upload even if delete fails
            }
          }

          // Upload file to Google Cloud Storage
          const uploadResult = await uploadFileToGCS(file)

          // Determine if this is a text file that can be previewed
          const isTextFile =
            file.type.startsWith("text/") ||
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

          // Store file metadata with storage information
          const fileMeta: UploadedFileMeta = {
            name: uploadResult.fileName || file.name,
            size: uploadResult.size || file.size,
            type: uploadResult.type || file.type,
            storageUrl: uploadResult.storageUrl,
            fileId: uploadResult.fileId,
            // Don't store content immediately - fetch it when preview is opened
            content: undefined,
          }

          onFileChange(nodeId, fileMeta)

          // For text files, we can optionally pre-load the content
          // But for now, we'll fetch it when preview is opened
          if (isTextFile) {
            setFileContent("") // Will be loaded when preview opens
          } else {
            setFileContent("Preview not available for this file type")
          }
        } catch (error) {
          const errorMsg = `Error uploading file: ${error instanceof Error ? error.message : "Unknown error"}`
          setFileContent(errorMsg)
          if (onFileChange) {
            onFileChange(nodeId, {
              name: file.name,
              size: file.size,
              type: file.type,
              content: errorMsg,
            })
          }
        }
      } else {
        // If removing file and we have a fileId, delete from database
        if (existingFileId) {
          try {
            await deleteFile(existingFileId)
            console.log("File deleted successfully from database and storage")
          } catch (error) {
            console.error("Error deleting file from database:", error)
            const errorMsg = error instanceof Error ? error.message : "Failed to delete file"
            alert(`Warning: ${errorMsg}. File removed from node but may still exist in storage.`)
            // Continue with removal even if delete fails
          }
        } else {
          console.warn("No fileId provided, skipping database deletion")
        }
        onFileChange(nodeId, null)
        setFileContent("")
      }
    },
    [onFileChange, nodeId, uploadFileToGCS, setFileContent, deleteFile]
  )

  return {
    isUploading,
    isLoadingContent,
    isCreating,
    isDeleting,
    uploadFileToGCS,
    fetchFileFromGCS,
    createFileInGCS,
    deleteFile,
    persistFile,
  }
}

