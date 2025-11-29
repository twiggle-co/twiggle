"use client"

import { useState } from "react"
import Link from "next/link"
import { Leaf, User } from "lucide-react"
import { useSession } from "next-auth/react"
import { LoginModal } from "@/components/auth/LoginModal"

export function HomeTopNav() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { data: session } = useSession()

  const handleLogoClick = () => {
    window.location.href = "/"
  }

  return (
    <>
      <div className="h-18 bg-[#7BA4F4] text-white flex items-center justify-between px-6">
        <button onClick={handleLogoClick} className="flex items-center gap-2 cursor-pointer">
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-black">
            <Leaf className="h-5 w-5" color="#7BA4F4" strokeWidth={2.5}/>
          </div>
          <span className="font-mono text-xl hover:underline ml-1">Twiggle</span>
        </button>

        <div className="flex items-center gap-4">
          {session ? (
            <Link
              href="/user"
              className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-black"
              title={session?.user?.email || "User"}
            >
              {session.user?.image && (
                <div className="flex justify-center">
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="rounded-full border-2 border-white"
                  />
                </div>
              )}
            </Link>
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
    </>
  )
}

