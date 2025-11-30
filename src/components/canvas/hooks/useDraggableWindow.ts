import { useCallback, useRef, useState, useEffect } from "react"

const SIDEBAR_WIDTH = 256
const TOPNAV_HEIGHT = 72

type WindowState = "normal" | "maximized" | "minimized"

export function useDraggableWindow() {
  const [windowState, setWindowState] = useState<WindowState>("normal")
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 })
  const [windowSize, setWindowSize] = useState({ width: 600, height: 400 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string>("")
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, windowX: 0, windowY: 0 })
  const windowRef = useRef<HTMLDivElement>(null)
  const titleBarRef = useRef<HTMLDivElement>(null)

  const getCanvasBounds = () => ({
    left: SIDEBAR_WIDTH,
    top: TOPNAV_HEIGHT,
    width: window.innerWidth - SIDEBAR_WIDTH,
    height: window.innerHeight - TOPNAV_HEIGHT,
  })

  const handleWindowDragStart = (e: React.MouseEvent) => {
    if (windowState === "maximized" || windowState === "minimized") return
    setIsDragging(true)
    const rect = windowRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleWindowDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return
      const canvasBounds = getCanvasBounds()
      let newX = e.clientX - dragOffset.x
      let newY = e.clientY - dragOffset.y

      // Constrain to canvas bounds
      const maxX = canvasBounds.left + canvasBounds.width - windowSize.width
      const maxY = canvasBounds.top + canvasBounds.height - windowSize.height

      newX = Math.max(canvasBounds.left, Math.min(newX, maxX))
      newY = Math.max(canvasBounds.top, Math.min(newY, maxY))

      setWindowPosition({ x: newX, y: newY })
    },
    [isDragging, dragOffset, windowSize, getCanvasBounds]
  )

  const handleWindowDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    if (windowState === "maximized" || windowState === "minimized") return
    e.stopPropagation()
    setIsResizing(true)
    setResizeDirection(direction)
    const rect = windowRef.current?.getBoundingClientRect()
    if (rect) {
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
        windowX: rect.left,
        windowY: rect.top,
      })
    }
  }

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return
      const canvasBounds = getCanvasBounds()
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y

      let newWidth = resizeStart.width
      let newHeight = resizeStart.height
      let newX = resizeStart.windowX
      let newY = resizeStart.windowY

      const MIN_WIDTH = 300
      const MIN_HEIGHT = 200

      // Handle resize based on direction
      if (resizeDirection.includes("e")) {
        newWidth = Math.max(MIN_WIDTH, Math.min(resizeStart.width + deltaX, canvasBounds.width - (newX - canvasBounds.left)))
      }
      if (resizeDirection.includes("w")) {
        newWidth = Math.max(MIN_WIDTH, Math.min(resizeStart.width - deltaX, canvasBounds.width - (canvasBounds.left + canvasBounds.width - (newX + resizeStart.width))))
        newX = resizeStart.windowX + resizeStart.width - newWidth
      }
      if (resizeDirection.includes("s")) {
        newHeight = Math.max(MIN_HEIGHT, Math.min(resizeStart.height + deltaY, canvasBounds.height - (newY - canvasBounds.top)))
      }
      if (resizeDirection.includes("n")) {
        newHeight = Math.max(MIN_HEIGHT, Math.min(resizeStart.height - deltaY, canvasBounds.height - (canvasBounds.top + canvasBounds.height - (newY + resizeStart.height))))
        newY = resizeStart.windowY + resizeStart.height - newHeight
      }

      // Constrain position and size to canvas bounds
      const maxX = canvasBounds.left + canvasBounds.width - newWidth
      const maxY = canvasBounds.top + canvasBounds.height - newHeight

      newX = Math.max(canvasBounds.left, Math.min(newX, maxX))
      newY = Math.max(canvasBounds.top, Math.min(newY, maxY))

      // Ensure window doesn't exceed canvas bounds
      if (newX + newWidth > canvasBounds.left + canvasBounds.width) {
        newWidth = canvasBounds.left + canvasBounds.width - newX
      }
      if (newY + newHeight > canvasBounds.top + canvasBounds.height) {
        newHeight = canvasBounds.top + canvasBounds.height - newY
      }

      setWindowSize({ width: newWidth, height: newHeight })
      setWindowPosition({ x: newX, y: newY })
    },
    [isResizing, resizeDirection, resizeStart, getCanvasBounds]
  )

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
  }, [])

  const handleMaximize = useCallback(() => {
    if (windowState === "maximized") {
      setWindowState("normal")
      // Could restore previous size/position here
    } else {
      setWindowState("maximized")
      const canvasBounds = getCanvasBounds()
      setWindowSize({
        width: canvasBounds.width,
        height: canvasBounds.height,
      })
      setWindowPosition({ x: canvasBounds.left, y: canvasBounds.top })
    }
  }, [windowState, getCanvasBounds])

  const resetWindow = useCallback(() => {
    setWindowState("normal")
    setWindowSize({ width: 600, height: 400 })
    setWindowPosition({ x: 0, y: 0 })
  }, [])

  const initializeWindow = useCallback((showPreview: boolean, prevShowPreview: boolean) => {
    if (showPreview && !prevShowPreview) {
      const canvasBounds = getCanvasBounds()
      setWindowState("normal")
      setWindowSize({ width: 600, height: 400 })
      setWindowPosition({
        x: canvasBounds.left + (canvasBounds.width - 600) / 2,
        y: canvasBounds.top + (canvasBounds.height - 400) / 2,
      })
    }
  }, [getCanvasBounds])

  // Drag event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleWindowDrag)
      document.addEventListener("mouseup", handleWindowDragEnd)
      return () => {
        document.removeEventListener("mousemove", handleWindowDrag)
        document.removeEventListener("mouseup", handleWindowDragEnd)
      }
    }
  }, [isDragging, handleWindowDrag, handleWindowDragEnd])

  // Resize event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResize)
      document.addEventListener("mouseup", handleResizeEnd)
      return () => {
        document.removeEventListener("mousemove", handleResize)
        document.removeEventListener("mouseup", handleResizeEnd)
      }
    }
  }, [isResizing, handleResize, handleResizeEnd])

  // Handle browser window resize
  useEffect(() => {
    const handleWindowResize = () => {
      if (windowState === "maximized") {
        const canvasBounds = getCanvasBounds()
        setWindowSize({
          width: canvasBounds.width,
          height: canvasBounds.height,
        })
        setWindowPosition({ x: canvasBounds.left, y: canvasBounds.top })
      } else {
        const canvasBounds = getCanvasBounds()
        const maxX = canvasBounds.left + canvasBounds.width - windowSize.width
        const maxY = canvasBounds.top + canvasBounds.height - windowSize.height
        
        setWindowPosition({
          x: Math.max(canvasBounds.left, Math.min(windowPosition.x, maxX)),
          y: Math.max(canvasBounds.top, Math.min(windowPosition.y, maxY)),
        })
      }
    }

    window.addEventListener("resize", handleWindowResize)
    return () => window.removeEventListener("resize", handleWindowResize)
  }, [windowState, windowSize, windowPosition, getCanvasBounds])

  return {
    windowState,
    windowPosition,
    windowSize,
    isDragging,
    windowRef,
    titleBarRef,
    handleWindowDragStart,
    handleResizeStart,
    handleMaximize,
    resetWindow,
    initializeWindow,
  }
}

