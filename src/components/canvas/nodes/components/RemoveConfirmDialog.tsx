"use client"

import { colors } from "@/lib/colors"

interface RemoveConfirmDialogProps {
  onConfirm: () => void
  onCancel: () => void
}

export function RemoveConfirmDialog({ onConfirm, onCancel }: RemoveConfirmDialogProps) {
  return (
    <div
      className="relative inset-0 rounded-[28px] bg-white/90 backdrop-blur-[2px] flex flex-col items-center justify-center text-center px-4"
      style={{ borderColor: colors.gray + "60" }}
    >
      <p className="text-sm font-semibold text-gray-700 mb-2">Remove this node?</p>
      <p className="text-xs text-gray-500 mb-4">
        Removing will also delete any connections attached to it.
      </p>
      <div className="nodrag flex gap-3 justify-center">
        <button
          type="button"
          className="px-4 py-2 rounded-full bg-gray-200 hover:brightness-90 text-gray-700 text-sm font-medium"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-full bg-red-500 hover:brightness-180 text-white text-sm font-semibold shadow"
          onClick={onConfirm}
        >
          Remove
        </button>
      </div>
    </div>
  )
}

