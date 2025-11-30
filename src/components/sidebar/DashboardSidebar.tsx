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
  Bell,
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
    <div className="w-64 bg-[#404040] border-r border-[#2a2a2a] flex flex-col h-full">
      <div className="p-4 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {session?.user?.profilePictureUrl || session?.user?.image ? (
              <img
                src={(session.user.profilePictureUrl || session.user.image) ?? ""}
                alt={userName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-[#404040] font-semibold">
                {userInitial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserProfileDropdown />
            {/* <button className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" aria-label="Notifications">
              <Bell className="h-4 w-4 text-white" />
            </button> */}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-sm text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.active
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? "bg-white text-[#404040]"
                    : "text-white hover:bg-white/20"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Team Section */}
        <div className="px-4 py-2 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-white/80" />
            <span className="text-xs font-medium text-white/80">{userName}'s team</span>
            <span className="ml-auto text-xs px-2 py-0.5 bg-white/30 text-white rounded">Free</span>
          </div>
        </div>

        {/* Project Links */}
        <div className="p-2">
          {projectItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-3 py-2 rounded-lg mb-1 text-white hover:bg-white/20 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.hasAdd && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      // Handle add draft action
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/30 rounded transition-opacity"
                    aria-label="Add draft"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Storage Usage Bar */}
      <div className="p-4 border-t border-[#2a2a2a] bg-[#2a2a2a]">
        <div className="flex items-center gap-2 mb-2">
          <HardDrive className="h-4 w-4 text-white/80" />
          <span className="text-xs font-medium text-white">Storage</span>
        </div>
        {isLoadingStorage ? (
          <div className="text-xs text-white/70">Loading...</div>
        ) : storageUsage ? (
          <>
            <div className="w-full bg-white/30 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  storageUsage.percentage >= 90
                    ? "bg-[#ef476f]"
                    : storageUsage.percentage >= 75
                    ? "bg-[#ffd166]"
                    : "bg-[#06d6a0]"
                }`}
                style={{ width: `${Math.min(100, storageUsage.percentage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-white/90">
              <span>
                {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.limit)}
              </span>
              <span className="font-medium">{storageUsage.percentage.toFixed(1)}%</span>
            </div>
          </>
        ) : (
          <div className="text-xs text-white/70">Unable to load storage</div>
        )}
      </div>
    </div>
  )
}
