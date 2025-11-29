"use client"

import Link from "next/link"
import { Sparkles, User, Save, AlertCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { useState } from "react"

interface LeafletTopNavProps {
  projectName?: string
  twigId: string
  hasUnsavedChanges?: boolean
}

/**
 * Leaflet (project canvas) top navigation
 */
export function LeafletTopNav({ 
  projectName, 
  twigId, 
  hasUnsavedChanges = false 
}: LeafletTopNavProps) {
  const { data: session } = useSession()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Call the global save function exposed by NodeCanvas
      if (typeof window !== "undefined" && (window as any).saveWorkflow) {
        await (window as any).saveWorkflow()
      }
    } catch (error) {
      console.error("Error saving:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-18 bg-[#7BA4F4] text-white flex items-center justify-between px-6">
      <Link href="/" className="flex items-center gap-2">
        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-black">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="font-semibold text-xl">Twiggle</span>
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="font-medium text-lg">
          {projectName ? `My Projects / ${projectName}` : "My Projects"}
        </Link>
        
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 text-yellow-200">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Unsaved changes</span>
          </div>
        )}
        
        <button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
          className="flex items-center gap-2 px-4 py-2 bg-white text-[#7BA4F4] rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={hasUnsavedChanges ? "Save changes" : "All changes saved"}
        >
          <Save className="h-4 w-4" />
          <span className="text-sm font-medium">
            {isSaving ? "Saving..." : "Save"}
          </span>
        </button>
      </div>

      <Link
        href="/user"
        className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-black overflow-hidden"
        title={session?.user?.email || "User"}
      >
        {session?.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="h-full w-full object-cover rounded-full border-2 border-white"
          />
        ) : (
          <User className="h-5 w-5" />
        )}
      </Link>
    </div>
  )
}
