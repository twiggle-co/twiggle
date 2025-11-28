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
  Plus
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserProfileDropdown } from "@/components/auth/UserProfileDropdown"

export function DashboardSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  
  const userInitial = session?.user?.name?.charAt(0).toUpperCase() || session?.user?.email?.charAt(0).toUpperCase() || "U"
  const userName = session?.user?.name || session?.user?.email || "User"

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
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#7BA4F4] rounded-full flex items-center justify-center text-white font-semibold">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserProfileDropdown />
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7BA4F4] focus:border-transparent"
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
                    ? "bg-[#7BA4F4] text-white"
                    : "text-gray-700 hover:bg-gray-100"
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
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500">Jaron Lee's team</span>
            <span className="ml-auto text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">Free</span>
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
                className="flex items-center justify-between px-3 py-2 rounded-lg mb-1 text-gray-700 hover:bg-gray-100 transition-colors group"
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
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

