"use client"

import { useState, useRef, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import {
  ChevronDown,
  Settings,
  LogOut,
  UserPlus,
  Pencil,
} from "lucide-react"
import { UserProfileModal } from "./UserProfileModal"

export function UserProfileDropdown() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownTop, setDropdownTop] = useState(0)
  const [dropdownLeft, setDropdownLeft] = useState(0)
  const [dropdownWidth, setDropdownWidth] = useState(246) // sidebar width - 10px

  const userInitial = session?.user?.name?.charAt(0).toUpperCase() || 
                     session?.user?.email?.charAt(0).toUpperCase() || "U"
  const userName = session?.user?.name || "User"
  const userEmail = session?.user?.email || ""

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownTop(rect.bottom + 16) // Larger gap at top
      // Center within sidebar (256px = w-64)
      // Find sidebar by traversing up the DOM tree
      let element: HTMLElement | null = buttonRef.current
      let sidebarElement: HTMLElement | null = null
      while (element && !sidebarElement) {
        if (element.classList.contains('w-64')) {
          sidebarElement = element
        } else {
          element = element.parentElement
        }
      }
      const sidebarLeft = sidebarElement?.getBoundingClientRect().left || 0
      const sidebarWidth = 256 // w-64 = 256px
      const calculatedWidth = sidebarWidth - 16 // sidebar width - 10px
      setDropdownWidth(calculatedWidth)
      setDropdownLeft(sidebarLeft + (sidebarWidth - calculatedWidth) / 2)
    }
  }, [isOpen])

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

  const handleOpenSettings = () => {
    setIsModalOpen(true)
    setIsOpen(false) // Close dropdown when opening modal
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <ChevronDown className="h-4 w-4 text-white" />
      </button>

      {isOpen && (
        <div 
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
          style={{ 
            top: `${dropdownTop}px`, 
            left: `${dropdownLeft}px`,
            width: `${dropdownWidth}px`
          }}
        >
          {/* User Profile Header */}
          <div className="p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                {session?.user?.profilePictureUrl || session?.user?.image ? (
                  <img
                    src={(session.user.profilePictureUrl || session.user.image) ?? ""}
                    alt={userName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 bg-[#118ab2] rounded-full flex items-center justify-center text-white text-lg font-semibold">
                    {userInitial}
                  </div>
                )}
                <button 
                  onClick={handleOpenSettings}
                  className="group absolute -bottom-1 -right-1 h-5 w-5 bg-gray-700 rounded-full flex items-center justify-center border border-transparent hover:bg-white hover:border-gray-300 transition-colors"
                  aria-label="Edit profile"
                >
                  <Pencil className="h-2.5 w-2.5 text-white group-hover:text-gray-600 transition-colors" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{userName}</h3>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-300 my-1" />

          {/* Menu Items */}
          <div className="py-1">
            <button 
              onClick={handleOpenSettings}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
            >
              <Settings className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-900">Settings</span>
            </button>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-300 my-1" />

          {/* Additional Options */}
          <div className="py-1">
            <button className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-left">
              <UserPlus className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-900">Add account</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
            >
              <LogOut className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-900">Log out</span>
            </button>
          </div>
        </div>
      )}

      <UserProfileModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  )
}
