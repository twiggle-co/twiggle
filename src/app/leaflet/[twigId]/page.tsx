"use client"

import { use } from "react"
import { LeafletTopNav } from "@/components/navigation/LeafletTopNav"
import { LeafletSidebar } from "@/components/sidebar/LeafletSidebar"
import { NodeCanvas } from "@/components/canvas/NodeCanvas"

export default function LeafletPage({
  params,
}: {
  params: Promise<{ twigId: string }>
}) {
  const { twigId } = use(params)

  // TODO: Fetch project data based on twigId
  const projectName = "Project Alpha" // This should come from API

  return (
    <div className="h-screen w-screen flex flex-col">
      <LeafletTopNav projectName={projectName} twigId={twigId} />
      <div className="flex flex-1 overflow-hidden">
        <LeafletSidebar />
        <NodeCanvas />
      </div>
    </div>
  )
}

