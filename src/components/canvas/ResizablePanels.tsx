"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { colors } from "@/lib/colors"

const DIVIDER_WIDTH = "12px"

type ViewMode = "node-only" | "mixed" | "file-only"

interface ResizablePanelsProps {
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  orientation?: "horizontal" | "vertical"
  snapThreshold?: number // Percentage from edge to trigger snap (default: 10%)
  animationDuration?: number // Animation duration in ms (default: 300)
}

export function ResizablePanels({
  leftPanel,
  rightPanel,
  viewMode,
  onViewModeChange,
  orientation = "vertical",
  snapThreshold = 10,
  animationDuration = 300,
}: ResizablePanelsProps) {
  const getTargetWidth = (mode: ViewMode): number => {
    switch (mode) {
      case "node-only":
        return 100
      case "file-only":
        return 0
      case "mixed":
        return 50
      default:
        return 50
    }
  }

  const [leftWidth, setLeftWidth] = useState(() => getTargetWidth(viewMode))
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const startLeftWidthRef = useRef(0)
  const rafIdRef = useRef<number | null>(null)
  const currentLeftWidthRef = useRef(leftWidth)
  const isAnimatingRef = useRef(false)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (isDraggingRef.current || isAnimatingRef.current) return

    const targetWidth = getTargetWidth(viewMode)
    const currentWidth = currentLeftWidthRef.current
    if (Math.abs(currentWidth - targetWidth) < 0.1) return

    isAnimatingRef.current = true
    const startWidth = currentWidth
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / animationDuration, 1)

      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2

      const newWidth = startWidth + (targetWidth - startWidth) * eased
      setLeftWidth(newWidth)
      currentLeftWidthRef.current = newWidth

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        isAnimatingRef.current = false
        animationRef.current = null
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      isAnimatingRef.current = false
    }
  }, [viewMode, animationDuration])

  useEffect(() => {
    currentLeftWidthRef.current = leftWidth
  }, [leftWidth])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (!containerRef.current) return

      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
        isAnimatingRef.current = false
      }

      isDraggingRef.current = true
      setIsDragging(true)
      const containerRect = containerRef.current.getBoundingClientRect()

      if (orientation === "vertical") {
        startXRef.current = e.clientX - containerRect.left
      } else {
        startXRef.current = e.clientY - containerRect.top
      }

      startLeftWidthRef.current = leftWidth

      document.body.style.cursor = orientation === "vertical" ? "ew-resize" : "ns-resize"
      document.body.style.userSelect = "none"

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current || !containerRef.current) return

        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
        }

        rafIdRef.current = requestAnimationFrame(() => {
          if (!containerRef.current || !isDraggingRef.current) return

          const containerRect = containerRef.current.getBoundingClientRect()
          let newPosition: number

          if (orientation === "vertical") {
            newPosition = e.clientX - containerRect.left
          } else {
            newPosition = e.clientY - containerRect.top
          }

          const delta = newPosition - startXRef.current
          const containerSize = orientation === "vertical" ? containerRect.width : containerRect.height
          const deltaPercent = (delta / containerSize) * 100

          let newLeftWidth = startLeftWidthRef.current + deltaPercent
          newLeftWidth = Math.max(0, Math.min(100, newLeftWidth))

          setLeftWidth(newLeftWidth)
          currentLeftWidthRef.current = newLeftWidth
        })
      }

      const handleMouseUp = () => {
        isDraggingRef.current = false
        setIsDragging(false)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""

        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
        }

        const finalLeftWidth = currentLeftWidthRef.current

        if (finalLeftWidth <= snapThreshold) {
          onViewModeChange("file-only")
        } else if (finalLeftWidth >= 100 - snapThreshold) {
          onViewModeChange("node-only")
        } else {
          if (viewMode !== "mixed") {
            onViewModeChange("mixed")
          }
        }

        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }

      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    },
    [leftWidth, orientation, onViewModeChange, snapThreshold, viewMode]
  )

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [])

  const isDividerVisible = viewMode === "mixed" || isDragging

  return (
    <div
      ref={containerRef}
      className="flex flex-1 overflow-hidden"
      style={{
        flexDirection: orientation === "vertical" ? "row" : "column",
      }}
    >
      {/* Left Panel (Node View) */}
      <div
        className="flex-shrink-0 overflow-hidden transition-none"
        style={{
          width: orientation === "vertical" ? `${leftWidth}%` : "100%",
          height: orientation === "horizontal" ? `${leftWidth}%` : "100%",
          transition: isDragging || isAnimatingRef.current
            ? "none"
            : `width ${animationDuration}ms ease-in-out, height ${animationDuration}ms ease-in-out`,
        }}
      >
        {leftPanel}
      </div>

      {isDividerVisible && (
        <div
          className="select-none relative flex items-center justify-center flex-shrink-0 group"
          style={{
            width: orientation === "vertical" ? DIVIDER_WIDTH : "100%",
            height: orientation === "vertical" ? "100%" : DIVIDER_WIDTH,
            minWidth: orientation === "vertical" ? DIVIDER_WIDTH : undefined,
            minHeight: orientation === "horizontal" ? DIVIDER_WIDTH : undefined,
            cursor: orientation === "vertical" ? "col-resize" : "row-resize",
            backgroundColor: viewMode === "mixed" ? "#ffffff" : "rgba(238, 238, 238, 0.5)",
          }}
          onMouseDown={handleMouseDown}
        >
          <div
            className="absolute"
            style={{
              width: orientation === "vertical" ? "1px" : "100%",
              height: orientation === "vertical" ? "100%" : "1px",
              left: orientation === "vertical" ? "0" : "0",
              top: orientation === "vertical" ? "0" : "0",
              backgroundColor: "#D6D6D6",
            }}
          />
          <div
            className="absolute"
            style={{
              width: orientation === "vertical" ? "1px" : "100%",
              height: orientation === "vertical" ? "100%" : "1px",
              right: orientation === "vertical" ? "0" : "0",
              bottom: orientation === "vertical" ? "0" : "0",
              backgroundColor: "#D6D6D6",
            }}
          />
          <div
            className="absolute"
            style={{
              width: orientation === "vertical" ? "1px" : "100%",
              height: "100px",
              left: orientation === "vertical" ? "50%" : "0",
              top: "50%",
              transform: orientation === "vertical" ? "translate(-50%, -50%)" : "translateY(-50%)",
              backgroundColor: "#BEBEBE",
            }}
          />
        </div>
      )}

      <div
        className="flex-shrink-0 overflow-hidden transition-none"
        style={{
          width: orientation === "vertical" ? `${100 - leftWidth}%` : "100%",
          height: orientation === "horizontal" ? `${100 - leftWidth}%` : "100%",
          transition: isDragging || isAnimatingRef.current
            ? "none"
            : `width ${animationDuration}ms ease-in-out, height ${animationDuration}ms ease-in-out`,
        }}
      >
        {rightPanel}
      </div>
    </div>
  )
}
