"use client"

import { useState } from "react"
import Link from "next/link"
import { Leaf } from "lucide-react"
import { useSession } from "next-auth/react"
import { LoginModal } from "@/components/auth/LoginModal"
import { UserProfileModal } from "@/components/auth/UserProfileModal"

export function HomeTopNav() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const { data: session } = useSession()

  return (
    <>
      <div className="h-18 bg-[#118ab2] text-white flex items-center justify-between px-6">
        <button
          onClick={() => window.location.href = "/"}
          className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-black">
            <Leaf className="h-5 w-5" color="#118ab2" strokeWidth={2.5} />
          </div>
          <span className="font-mono text-xl hover:underline ml-1">Twiggle</span>
        </button>

        <div className="flex items-center gap-4">
          {session ? (
            <button
              onClick={() => setShowUserModal(true)}
              className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-black hover:opacity-90 transition-opacity overflow-hidden"
              title={session?.user?.email || "User"}
            >
              {session.user?.profilePictureUrl || session.user?.image ? (
                <img
                  src={(session.user.profilePictureUrl || session.user.image) ?? ""}
                  alt={session.user.name || "User"}
                  className="h-10 w-10 rounded-full border-2 border-white object-cover"
                />
              ) : (
                <span className="text-[#118ab2] font-semibold">
                  {session.user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="font-mono hover:underline cursor-pointer text-xl"
            >
              Login
            </button>
          )}
        </div>
      </div>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <UserProfileModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} />
    </>
  )
}
