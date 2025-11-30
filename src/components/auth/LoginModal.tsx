"use client"

import { useState, useRef } from "react"
import { X } from "lucide-react"
import { signIn } from "next-auth/react"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Login modal component
 * Supports Google OAuth and email/password (if configured)
 */
export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const backdropRef = useRef<HTMLDivElement>(null)
  const mouseDownRef = useRef<{ target: EventTarget | null; time: number } | null>(null)

  if (!isOpen) return null

  const handleGoogleSignIn = () => {
    signIn("google")
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      alert("Please enter both email and password")
      return
    }
    
    try {
      const result = await signIn("credentials", {
        username: email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      })
      
      if (result?.error) {
        alert("Login failed: " + result.error)
      } else if (result?.ok) {
        onClose()
        window.location.href = "/dashboard"
      }
    } catch (error) {
      console.error("Login error:", error)
      alert("Login failed. Please try again.")
    }
  }

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      mouseDownRef.current = {
        target: e.target,
        time: Date.now(),
      }
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    const selection = window.getSelection()
    const hasSelection = selection !== null && selection.toString().length > 0
    
    if (
      e.target === backdropRef.current &&
      mouseDownRef.current?.target === backdropRef.current &&
      !hasSelection
    ) {
      onClose()
    }
    mouseDownRef.current = null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div ref={backdropRef} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="m-5 p-8">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-400 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-black font-medium">Login with Google</span>
          </button>

          {/* Separator */}
          <div className="flex items-center justify-center mb-4">
            <span className="text-black text-sm">or</span>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label className="block text-black text-xs font-medium mb-1">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 rounded border-none text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder=""
                required
              />
            </div>

            <div>
              <label className="block text-black text-xs font-medium mb-1">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 rounded border-none text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder=""
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#ef476f] text-white py-3 rounded-lg hover:bg-[#d63d5f] transition-colors flex items-center justify-center gap-2"
            >
              <span>Log in</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 space-y-2 text-center">
            <a href="#" className="block text-[#118ab2] text-sm hover:underline">
              Use single sign-on
            </a>
            <a href="#" className="block text-[#118ab2] text-sm hover:underline">
              Reset password
            </a>
            <div className="text-sm text-gray-600">
              No account?{" "}
              <a href="#" className="text-[#118ab2] hover:underline">
                Create one
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
