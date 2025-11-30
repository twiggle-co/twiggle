"use client"

import { useState, useRef } from "react"
import { X } from "lucide-react"
import { useSession, signOut } from "next-auth/react"

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

type Tab = "Account" | "Community" | "Notifications" | "Security"

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>("Account")
  const backdropRef = useRef<HTMLDivElement>(null)
  const mouseDownRef = useRef<{ target: EventTarget | null; time: number } | null>(null)

  if (!isOpen) return null

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      mouseDownRef.current = {
        target: e.target,
        time: Date.now(),
      }
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    const selection = window.getSelection()
    const hasSelection = selection !== null && selection.toString().length > 0
    
    if (
      e.target === backdropRef.current &&
      mouseDownRef.current?.target === backdropRef.current &&
      !hasSelection
    ) {
      onClose()
    }
    mouseDownRef.current = null
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  const tabs: Tab[] = ["Account", "Community", "Notifications", "Security"]
  const userName = session?.user?.name || "User"
  const userEmail = session?.user?.email || ""
  const userInitial = userName.charAt(0).toUpperCase()

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
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={userName}
                      className="h-24 w-24 rounded-full"
                    />
                  ) : (
                    <div className="h-24 w-24 bg-[#118ab2] rounded-full flex items-center justify-center text-white text-3xl font-semibold">
                      {userInitial}
                    </div>
                  )}
                  <button className="absolute bottom-0 right-0 px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-800 transition-colors">
                    Edit
                  </button>
                </div>
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

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme
                  </label>
                  <select className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#118ab2]">
                    <option>System theme</option>
                    <option>Light</option>
                    <option>Dark</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enhance contrast
                    </label>
                    <p className="text-xs text-gray-500">
                      When enabled, contrast between text and controls and their backgrounds will be increased
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#118ab2] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#118ab2]"></div>
                  </label>
                </div> */}
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

