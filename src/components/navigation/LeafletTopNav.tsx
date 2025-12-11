"use client"

import Link from "next/link"
import { Save, Leaf, Route, MessageCircle, Split } from "lucide-react"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { UserProfileModal } from "@/components/auth/UserProfileModal"
import { colors } from "@/lib/colors"

export type ViewMode = "node-only" | "mixed" | "chat-only"

interface LeafletTopNavProps {
  projectName?: string
  twigId: string
  hasUnsavedChanges?: boolean
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
}

export function LeafletTopNav({ 
  projectName, 
  twigId, 
  hasUnsavedChanges = false,
  viewMode = "mixed",
  onViewModeChange,
}: LeafletTopNavProps) {
  const { data: session } = useSession()
  const [isSaving, setIsSaving] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const windowWithSave = window as typeof window & { saveWorkflow?: () => Promise<void> }
      if (typeof window !== "undefined" && windowWithSave.saveWorkflow) {
        await windowWithSave.saveWorkflow()
      }
    } catch {
      // Ignore save errors
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-18 text-white flex items-center justify-between px-6 relative" style={{ backgroundColor: colors.primary }}>
      <button
        onClick={() => window.location.href = "/"}
        className="flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
          <Leaf className="h-5 w-5" color="#118ab2" strokeWidth={2.5} />
        </div>
        <span className="font-logo text-3xl hover:underline ml-1">Twiggle</span>
      </button>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
        <Link href="/dashboard" className="font-medium text-lg">
          {projectName ? `My Projects / ${projectName}` : "My Projects"}
        </Link>
        
        <button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ color: colors.primary }}
          title={hasUnsavedChanges ? "Save changes" : "All changes saved"}
        >
          <Save className="h-4 w-4" />
          <span className="text-sm font-medium">
            {isSaving ? "Saving..." : "Save"}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2 z-10">
        <div className="flex gap-1 bg-white/20 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange?.("node-only")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "node-only"
                ? "bg-white"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
            style={viewMode === "node-only" ? { color: colors.primary } : undefined}
            title="Node only view"
          >
            <Route className="h-5 w-5" />
          </button>
          <button
            onClick={() => onViewModeChange?.("mixed")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "mixed"
                ? "bg-white"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
            style={viewMode === "mixed" ? { color: colors.primary } : undefined}
            title="Mixed view"
          >
            <Split className="h-5 w-5" />
          </button>
          <button
            onClick={() => onViewModeChange?.("chat-only")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "chat-only"
                ? "bg-white"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
            style={viewMode === "chat-only" ? { color: colors.primary } : undefined}
            title="Chat only view"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={() => setShowUserModal(true)}
          className="h-10 w-10 ml-4 bg-white rounded-full flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity"
          title={session?.user?.email || "User"}
        >
          {session?.user?.profilePictureUrl ? (
            <img
              src={session.user.profilePictureUrl}
              alt={session.user.name || "User"}
              className="h-full w-full object-cover rounded-full border-2 border-white"
            />
          ) : (
            <span className="text-[#118ab2] font-semibold text-lg">
              {session?.user?.name?.charAt(0).toUpperCase() || 
               session?.user?.email?.charAt(0).toUpperCase() || "U"}
            </span>
          )}
        </button>
      </div>

      <UserProfileModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} />
    </div>
  )
}
