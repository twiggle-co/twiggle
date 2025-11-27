"use client"

import { ReactNode } from "react"
import { TopNav } from "./TopNav"
import { Sidebar } from "./Sidebar"

type MainShellProps = {
  children: ReactNode
  projectName?: string
}

export function MainShell({ children, projectName }: MainShellProps) {
  return (
    <div className="h-screen w-screen flex flex-col">
      <TopNav projectName={projectName} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        {children}
      </div>
    </div>
  )
}
