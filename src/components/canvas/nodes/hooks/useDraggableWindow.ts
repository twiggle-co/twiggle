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

  const getCanvasBounds = useCallback(() => {
    return {
      left: SIDEBAR_WIDTH,
      top: TOPNAV_HEIGHT,
      width: window.innerWidth - SIDEBAR_WIDTH,
      height: window.innerHeight - TOPNAV_HEIGHT,
    }
  }, [])

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

  const handleWindowDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || windowState === "maximized" || windowState === "minimized") return

    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y
    const canvasBounds = getCanvasBounds()

    const finalX = Math.max(
      canvasBounds.left,
      Math.min(newX, canvasBounds.left + canvasBounds.width - windowSize.width)
    )
    const finalY = Math.max(
      canvasBounds.top,
      Math.min(newY, canvasBounds.top + canvasBounds.height - windowSize.height)
    )

    setWindowPosition({ x: finalX, y: finalY })
  }, [isDragging, dragOffset, windowState, windowSize, getCanvasBounds])

  const handleWindowDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    if (windowState === "maximized" || windowState === "minimized") return
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeDirection(direction)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: windowSize.width,
      height: windowSize.height,
      windowX: windowPosition.x,
      windowY: windowPosition.y,
    })
  }

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || windowState === "maximized" || windowState === "minimized") return

    const deltaX = e.clientX - resizeStart.x
    const deltaY = e.clientY - resizeStart.y
    const canvasBounds = getCanvasBounds()
    
    let newWidth = resizeStart.width
    let newHeight = resizeStart.height
    let newX = resizeStart.windowX
    let newY = resizeStart.windowY

    // Handle horizontal resizing
    if (resizeDirection.includes("e")) {
      const maxWidth = canvasBounds.left + canvasBounds.width - resizeStart.windowX
      newWidth = Math.min(
        Math.max(300, resizeStart.width + deltaX),
        maxWidth
      )
    } else if (resizeDirection.includes("w")) {
      const maxWidthChange = resizeStart.windowX - canvasBounds.left
      const minWidthChange = resizeStart.width - 300
      const widthChange = Math.max(-minWidthChange, Math.min(deltaX, maxWidthChange))
      
      newWidth = resizeStart.width - widthChange
      newX = resizeStart.windowX + widthChange
      
      if (newX < canvasBounds.left) {
        newWidth = newWidth - (canvasBounds.left - newX)
        newX = canvasBounds.left
      }
    }

    // Handle vertical resizing
    if (resizeDirection.includes("s")) {
      const maxHeight = canvasBounds.top + canvasBounds.height - resizeStart.windowY
      newHeight = Math.min(
        Math.max(200, resizeStart.height + deltaY),
        maxHeight
      )
    } else if (resizeDirection.includes("n")) {
      const maxHeightChange = resizeStart.windowY - canvasBounds.top
      const minHeightChange = resizeStart.height - 200
      const heightChange = Math.max(-minHeightChange, Math.min(deltaY, maxHeightChange))
      
      newHeight = resizeStart.height - heightChange
      newY = resizeStart.windowY + heightChange
      
      if (newY < canvasBounds.top) {
        newHeight = newHeight - (canvasBounds.top - newY)
        newY = canvasBounds.top
      }
    }

    // Final validation
    newWidth = Math.max(300, newWidth)
    newHeight = Math.max(200, newHeight)
    
    newX = Math.max(canvasBounds.left, Math.min(newX, canvasBounds.left + canvasBounds.width - newWidth))
    newY = Math.max(canvasBounds.top, Math.min(newY, canvasBounds.top + canvasBounds.height - newHeight))
    
    newWidth = Math.min(newWidth, canvasBounds.width)
    newHeight = Math.min(newHeight, canvasBounds.height)

    setWindowSize({ width: newWidth, height: newHeight })
    setWindowPosition({ x: newX, y: newY })
  }, [isResizing, resizeDirection, resizeStart, windowState, getCanvasBounds])

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    setResizeDirection("")
  }, [])

  const handleMaximize = useCallback(() => {
    const canvasBounds = getCanvasBounds()
    if (windowState === "maximized") {
      setWindowState("normal")
      setWindowSize({ width: 600, height: 400 })
      setWindowPosition({
        x: canvasBounds.left + (canvasBounds.width - 600) / 2,
        y: canvasBounds.top + (canvasBounds.height - 400) / 2,
      })
    } else if (windowState === "minimized") {
      setWindowState("normal")
      setWindowSize({ width: 600, height: 400 })
      setWindowPosition({
        x: canvasBounds.left + (canvasBounds.width - 600) / 2,
        y: canvasBounds.top + (canvasBounds.height - 400) / 2,
      })
    } else {
      setWindowState("maximized")
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

