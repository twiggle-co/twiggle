"use client"

import { MainShell } from "@/components/layout/MainShell"
import { NodeCanvas } from "@/components/canvas/NodeCanvas"

export default function Page() {
  return (
    <MainShell projectName="Alpha-1">
      <NodeCanvas />
    </MainShell>
  )
}
