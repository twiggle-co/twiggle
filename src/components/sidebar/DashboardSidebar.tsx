"use client"

import { useSession } from "next-auth/react"
import { 
  Search, 
  Clock, 
  Building2, 
  Users, 
  FileText, 
  Grid3x3, 
  Monitor, 
  Trash2,
  Plus,
  HardDrive
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserProfileDropdown } from "@/components/auth/UserProfileDropdown"
import { useEffect, useState } from "react"

interface StorageUsage {
  used: number
  limit: number
  percentage: number
  fileStorage: number
  projectStorage: number
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

export function DashboardSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null)
  const [isLoadingStorage, setIsLoadingStorage] = useState(true)
  
  const userInitial = session?.user?.name?.charAt(0).toUpperCase() || 
                     session?.user?.email?.charAt(0).toUpperCase() || "U"
  const userName = session?.user?.name || session?.user?.email || ""

  useEffect(() => {
    if (session?.user?.id) {
      fetchStorageUsage()
    }
  }, [session?.user?.id])

  const fetchStorageUsage = async () => {
    try {
      setIsLoadingStorage(true)
      const response = await fetch("/api/storage")
      if (response.ok) {
        const data = await response.json()
        setStorageUsage(data)
      }
    } catch {
    } finally {
      setIsLoadingStorage(false)
    }
  }

  const navItems = [
    { icon: Clock, label: "Recents", href: "/dashboard", active: pathname === "/dashboard" },
    { icon: Building2, label: "Community", href: "/dashboard/community" },
  ]

  const projectItems = [
    { icon: FileText, label: "Drafts", href: "/dashboard/drafts", hasAdd: true },
    { icon: Grid3x3, label: "All projects", href: "/dashboard/projects" },
    { icon: Monitor, label: "Resources", href: "/dashboard/resources" },
    { icon: Trash2, label: "Trash", href: "/dashboard/trash" },
  ]

  return (
    <div className="w-60 bg-[#404040] border-r border-[#2a2a2a] flex flex-col h-full">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {session?.user?.profilePictureUrl ? (
              <img
                src={session.user.profilePictureUrl}
                alt={userName}
                className="h-7 w-7 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-7 w-7 bg-white rounded-full flex items-center justify-center text-[#404040] font-semibold text-xs flex-shrink-0">
                {userInitial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <UserProfileDropdown />
          </div>
        </div>

        <div className="relative pt-1">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/70 pointer-events-none" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-7 pr-2 py-1.5 bg-white/20 border border-white/30 rounded-lg text-xs text-white placeholder:text-white/70 focus:outline-none focus:ring-1 focus:ring-white/50 focus:border-white/50"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-1 border-b border-[#2a2a2a]">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.active
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 transition-colors ${
                  isActive
                    ? "bg-white text-[#404040]"
                    : "text-white hover:bg-white/20"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="px-3 py-1 mt-1">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-white/80 flex-shrink-0" />
            <span className="text-xs font-medium text-white/80 truncate min-w-0">{userName}'s team</span>
            <span className="ml-auto text-[11px] px-1.5 py-0.5 bg-white/30 text-white rounded flex-shrink-0">Free</span>
          </div>
        </div>

        <div className="px-3 py-1">
          {projectItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-2 py-1.5 rounded-lg mb-0.5 text-white hover:bg-white/20 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{item.label}</span>
                </div>
                {item.hasAdd && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/30 rounded transition-opacity flex-shrink-0"
                    aria-label="Add draft"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="p-2 border-t border-[#2a2a2a] bg-[#2a2a2a]">
        <div className="flex items-center gap-1.5 mb-1.5">
          <HardDrive className="h-3.5 w-3.5 text-white/80 flex-shrink-0" />
          <span className="text-xs font-medium text-white">Storage</span>
        </div>
        {isLoadingStorage ? (
          <div className="text-[11px] text-white/70">Loading...</div>
        ) : storageUsage ? (
          <>
            <div className="w-full bg-white/30 rounded-full h-1.5 mb-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  storageUsage.percentage >= 90
                    ? "bg-[#ef476f]"
                    : storageUsage.percentage >= 75
                    ? "bg-[#ffd166]"
                    : "bg-[#06d6a0]"
                }`}
                style={{ width: `${Math.min(100, storageUsage.percentage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/90">
              <span className="text-[11px] truncate min-w-0">
                {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.limit)}
              </span>
              <span className="text-[11px] font-medium flex-shrink-0 ml-1">{storageUsage.percentage.toFixed(1)}%</span>
            </div>
          </>
        ) : (
          <div className="text-[11px] text-white/70">Unable to load storage</div>
        )}
      </div>
    </div>
  )
}
