"use client"

import { useState } from "react"
import Link from "next/link"
import { Leaf } from "lucide-react"
import { LoginModal } from "@/components/auth/LoginModal"

export function HomeTopNav() {
  const [showLoginModal, setShowLoginModal] = useState(false)

  return (
    <>
      <div className="h-18 bg-[#7BA4F4] text-white flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-black">
            <Leaf className="h-5 w-5" color="#7BA4F4" strokeWidth={2.5}/>
          </div>
          <span className="font-mono text-xl">Twiggle</span>
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowLoginModal(true)}
            className="font-mono hover:underline cursor-pointer text-xl"
          >
            Login
          </button>
        </div>
      </div>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  )
}

