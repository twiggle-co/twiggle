"use client"

import { useState, useRef } from "react"
import { X } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

type Tab = "Account" | "Community" | "Notifications" | "Security"

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("Account")
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
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

  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  const handleEditPictureClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file. Only image files are allowed.")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/users/profile-picture", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload profile picture")
      }

      await update()
      router.refresh()
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload profile picture")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemovePicture = async () => {
    if (!session?.user?.profilePictureUrl) return

    setIsRemoving(true)
    setUploadError(null)

    try {
      const response = await fetch("/api/users/profile-picture", {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to remove profile picture")
      }

      await update()
      router.refresh()
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to remove profile picture")
    } finally {
      setIsRemoving(false)
    }
  }

  const tabs: Tab[] = ["Account", "Community", "Notifications", "Security"]
  const userName = session?.user?.name || "User"
  const userEmail = session?.user?.email || ""
  const userInitial = userName.charAt(0).toUpperCase()
  const profilePictureUrl = session?.user?.profilePictureUrl

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
    >
      <div ref={backdropRef} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      <div
        className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-gray-200">
          <div className="px-6 pt-6 pb-0">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Profile</h2>
          </div>
          <div className="flex px-6 gap-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-[#118ab2] text-[#118ab2]"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "Account" && (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt={userName}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-24 w-24 bg-[#118ab2] rounded-full flex items-center justify-center text-white text-3xl font-semibold">
                      {userInitial}
                    </div>
                  )}
                  {profilePictureUrl ? (
                    <button
                      onClick={handleRemovePicture}
                      disabled={isRemoving}
                      className="absolute bottom-0 right-0 px-2 py-0.5 bg-red-600 text-white text-[10px] rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRemoving ? "Removing..." : "Remove"}
                    </button>
                  ) : (
                    <button
                      onClick={handleEditPictureClick}
                      disabled={isUploading}
                      className="absolute bottom-0 right-0 px-2 py-0.5 bg-gray-700 text-white text-[10px] rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? "Uploading..." : "Edit"}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                {uploadError && (
                  <div className="text-sm text-red-600 mt-2">{uploadError}</div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900">{userName}</p>
                    <button className="text-sm text-[#118ab2] hover:underline">
                      Change name
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900">{userEmail}</p>
                    <span className="text-xs text-gray-500">Managed by Google</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900">English</p>
                    <button className="text-sm text-[#118ab2] hover:underline">
                      Change language
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Community" && (
            <div className="space-y-4">
              <p className="text-gray-600">Community settings coming soon...</p>
            </div>
          )}

          {activeTab === "Notifications" && (
            <div className="space-y-4">
              <p className="text-gray-600">Notification settings coming soon...</p>
            </div>
          )}

          {activeTab === "Security" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Security</h3>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

