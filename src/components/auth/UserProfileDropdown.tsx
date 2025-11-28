"use client"

import { useState, useRef, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import {
  ChevronDown,
  Settings,
  Download,
  LogOut,
  Palette,
  UserPlus,
  Pencil,
} from "lucide-react"

export function UserProfileDropdown() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const userInitial = session?.user?.name?.charAt(0).toUpperCase() || 
                     session?.user?.email?.charAt(0).toUpperCase() || "U"
  const userName = session?.user?.name || "User"
  const userEmail = session?.user?.email || ""

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="User menu"
      >
        <ChevronDown className="h-4 w-4 text-gray-600" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-full ml-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* User Profile Header */}
          <div className="p-6 bg-white">
            <div className="relative inline-block mb-3">
              <div className="h-20 w-20 bg-[#7BA4F4] rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                {userInitial}
              </div>
              <button className="absolute bottom-0 right-0 h-6 w-6 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
                <Pencil className="h-3 w-3 text-white" />
              </button>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{userName}</h3>
            <p className="text-sm text-gray-500">{userEmail}</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-900">Theme</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 rotate-[-90deg]" />
            </button>

            <button className="w-full flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors text-left">
              <Settings className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-900">Settings</span>
            </button>

            <button className="w-full flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors text-left">
              <Download className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-900">Get desktop app</span>
            </button>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200 my-2" />

          {/* Additional Options */}
          <div className="py-2">
            <button className="w-full flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors text-left">
              <div className="h-8 w-8 bg-[#7BA4F4] rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {userInitial}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Create a community profile</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors text-left">
              <UserPlus className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-900">Add account</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <LogOut className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-900">Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

