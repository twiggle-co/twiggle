"use client"

import Link from "next/link"
import { Sparkles, User } from "lucide-react"
import { useSession } from "next-auth/react"

export function DashboardTopNav() {
  const { data: session } = useSession()

  return (
    <div className="h-18 bg-[#7BA4F4] text-white flex items-center justify-between px-6">
      <Link href="/" className="flex items-center gap-2">
        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-black">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="font-semibold text-xl">Twiggle</span>
      </Link>

      <Link href="/dashboard" className="font-medium text-lg">
        My Projects
      </Link>

      <Link
        href="/user"
        className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-black"
        title={session?.user?.email || "User"}
      >
        <User className="h-5 w-5" />
      </Link>
    </div>
  )
}

