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
  const [dropdownWidth, setDropdownWidth] = useState(182)

  const userInitial = session?.user?.name?.charAt(0).toUpperCase() || 
                     session?.user?.email?.charAt(0).toUpperCase() || "U"
  const userName = session?.user?.name || "User"
  const userEmail = session?.user?.email || ""

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownTop(rect.bottom + 16)

      let element: HTMLElement | null = buttonRef.current
      let sidebarElement: HTMLElement | null = null
      while (element && !sidebarElement) {
        if (element.classList.contains('w-48') || 
            element.classList.contains('w-60') || 
            element.classList.contains('w-64') ||
            element.hasAttribute('data-sidebar')) {
          sidebarElement = element
        } else {
          element = element.parentElement
        }
      }
      
      if (sidebarElement) {
        const sidebarRect = sidebarElement.getBoundingClientRect()
        const sidebarWidth = sidebarRect.width
        const sidebarLeft = sidebarRect.left
        const calculatedWidth = sidebarWidth - 10
        setDropdownWidth(calculatedWidth)
        setDropdownLeft(sidebarLeft + (sidebarWidth - calculatedWidth) / 2)
      } else {
        setDropdownLeft(rect.left)
        setDropdownWidth(182)
      }
    }
  }, [isOpen])

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
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <ChevronDown className="h-3 w-3 text-white" />
      </button>

      {isOpen && (
        <div 
          className="fixed p-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
          style={{ 
            top: `${dropdownTop - 5}px`, 
            left: `${dropdownLeft}px`,
            width: `${dropdownWidth}px`
          }}
        >
          <div className="p-3 bg-white">
            <div className="flex items-center gap-2">
              <div className="relative flex-shrink-0">
                {session?.user?.profilePictureUrl ? (
                  <img
                    src={session.user.profilePictureUrl}
                    alt={userName}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 bg-[#118ab2] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {userInitial}
                  </div>
                )}
                <button 
                  onClick={handleOpenSettings}
                  className="group absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-gray-700 rounded-full flex items-center justify-center border border-transparent hover:bg-white hover:border-gray-300 transition-colors"
                  aria-label="Edit profile"
                >
                  <Pencil className="h-2 w-2 text-white group-hover:text-gray-600 transition-colors" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold text-gray-900 truncate">{userName}</h3>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 my-0.5" />

          <div className="py-2">
            <button 
              onClick={handleOpenSettings}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 transition-colors text-left"
            >
              <Settings className="h-3.5 w-3.5 text-gray-600" />
              <span className="text-xs text-gray-900">Settings</span>
            </button>
          </div>

          <div className="border-t border-gray-300 my-0.5" />

          <div className="py-2">
            <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 transition-colors text-left">
              <UserPlus className="h-3.5 w-3.5 text-gray-600" />
              <span className="text-xs text-gray-900">Add account</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 transition-colors text-left"
            >
              <LogOut className="h-3.5 w-3.5 text-gray-600" />
              <span className="text-xs text-gray-900">Log out</span>
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
