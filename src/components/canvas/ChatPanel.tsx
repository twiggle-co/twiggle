"use client"

import { useState, useRef } from "react"
import { Plus, Mic } from "lucide-react"

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
          <div className="flex items-center w-full max-w-2xl min-w-60 border border-gray-300 rounded-full bg-white focus-within:ring-2 focus-within:ring-[#118ab2] focus-within:border-transparent transition-all">
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
              />
            </div>
            <button
              type="button"
              className="flex-shrink-0 px-5 text-[#118ab2] hover:text-[#0f7a9a] transition-colors"
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

