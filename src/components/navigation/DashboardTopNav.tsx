"use client"

import Link from "next/link"
import { Leaf } from "lucide-react"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { UserProfileModal } from "@/components/auth/UserProfileModal"
import { colors } from "@/lib/colors"

export function DashboardTopNav() {
  const { data: session } = useSession()
  const [showUserModal, setShowUserModal] = useState(false)

  return (
    <div className="h-15 text-white flex items-center justify-between px-6 relative" style={{ backgroundColor: colors.primary }}>
      <button
        onClick={() => window.location.href = "/"}
        className="flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
          <Leaf className="h-4 w-4" color="#118ab2" strokeWidth={2.5} />
        </div>
        <span className="font-logo text-2xl hover:underline ml-1">Twiggle</span>
      </button>

      <div className="absolute left-[calc(50%)] -translate-x-1/2 flex items-center gap-4">
        <Link href="/dashboard" className="font-medium text-base">
          Leaflets
        </Link>
      </div>

      <div className="flex items-center gap-2 z-10">
        <button
          onClick={() => setShowUserModal(true)}
          className="h-8 w-8 bg-white rounded-full flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity"
          title={session?.user?.email || "User"}
        >
          {session?.user?.profilePictureUrl ? (
            <img
              src={session.user.profilePictureUrl}
              alt={session.user.name || "User"}
              className="h-full w-full object-cover rounded-full border-2 border-white"
            />
          ) : (
            <span className="text-[#118ab2] font-semibold text-sm">
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

