"use client"

import Link from "next/link"
import { Sparkles, User } from "lucide-react"

type TopNavProps = {
  projectName?: string
}

export function TopNav({ projectName }: TopNavProps) {
  return (
    <div className="h-18 bg-[#7BA4F4] text-white flex items-center justify-between px-6">
      <Link href="/" className="flex items-center gap-2">
        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-black">
          <Sparkles className="h-5 w-5" />
        </div>
      </Link>

      <Link href="/projects" className="font-medium text-lg">
        {projectName ? `My Projects / ${projectName}` : "My Projects"}
      </Link>

      <Link
        href="/user"
        className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-black"
      >
        <User className="h-5 w-5" />
      </Link>
    </div>
  )
}
