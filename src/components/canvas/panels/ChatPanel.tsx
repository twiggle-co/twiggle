"use client"

import { useState, useRef } from "react"
import { Plus, Mic } from "lucide-react"
import { colors } from "@/lib/colors"

export function ChatPanel() {
  const [message, setMessage] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // TODO: Add AI response logic here
    setMessage("")

    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    // Auto-resize textarea
    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-sm">Chat with Sprite here!</p>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 mr-3">
        <form onSubmit={handleSubmit} className="justify-center flex">
          <div 
            className="flex items-center w-full max-w-2xl min-w-60 border rounded-full bg-white transition-all"
            style={{
              borderColor: colors.gray + "80",
            }}
          >
            <button
              type="button"
              className="flex-shrink-0 px-3 text-gray-400 hover:text-gray-600 transition-colors"
              title="Add attachment"
            >
              <Plus className="h-5 w-5" />
            </button>
            <div className="flex-1 flex items-center overflow-hidden min-w-0">
              <textarea
                ref={inputRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything"
                rows={1}
                className="w-full p-3.5 border-0 resize-none focus:outline-none text-sm bg-transparent"
                style={{ 
                  minHeight: "48px", 
                  maxHeight: "200px",
                  lineHeight: "1.5",
                  whiteSpace: "nowrap",
                  overflow: "hidden"
                }}
                onFocus={(e) => {
                  const container = e.currentTarget.closest("div")
                  if (container) {
                    container.style.borderColor = "transparent"
                    container.style.boxShadow = `0 0 0 2px ${colors.primary}`
                  }
                }}
                onBlur={(e) => {
                  const container = e.currentTarget.closest("div")
                  if (container) {
                    container.style.borderColor = colors.gray + "80"
                    container.style.boxShadow = ""
                  }
                }}
              />
            </div>
            <button
              type="button"
              className="flex-shrink-0 px-5 transition-colors"
              style={{
                color: colors.primary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.blueDark
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.primary
              }}
              title="Voice input"
            >
              <Mic className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

