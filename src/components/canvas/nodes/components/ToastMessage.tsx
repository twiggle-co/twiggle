"use client"

import { useEffect, useState } from "react"
import { X, AlertCircle } from "lucide-react"
import { colors } from "@/lib/colors"

interface ToastMessageProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export function ToastMessage({ message, isVisible, onClose, duration = 3000 }: ToastMessageProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] toast-slide-in">
      <div
        className="flex items-center gap-3 rounded-lg shadow-lg px-4 py-3 min-w-[300px] max-w-[500px] border"
        style={{
          backgroundColor: colors.warning + "15",
          borderColor: colors.warning + "40",
        }}
      >
        <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: colors.warning }} />
        <p className="text-sm text-gray-700 flex-1">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Close message"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

