"use client"

import { HomeTopNav } from "@/components/navigation/HomeTopNav"
import { useState, useCallback, useEffect, useMemo } from 'react'
import { ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges, BackgroundVariant, ReactFlowProvider, useReactFlow, type Node, type Edge, Handle, Position } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// Twiggle features
const projectMessages = [
  "Visual workflow builder with drag-and-drop interface",
  "Connect files, agents, and tools in an intuitive canvas",
  "Upload and store files seamlessly with Google Cloud Storage",
  "Preview and edit files in interactive popout windows",
  "Create and organize projects with 'leaflets' system",
  "Link nodes together to build powerful automation workflows",
  "Real-time collaboration and project synchronization",
  "Secure authentication with Google OAuth integration",
  "Node-based architecture for flexible workflow design",
  "Cloud storage integration for easy file management",
  "Interactive canvas with zoom, pan, and fit-to-view controls",
  "Extensible platform supporting multiple file types and formats",
]

// Custom node component with project introduction text
function ProjectNode({ data }: { data: { label: string; message: string } }) {
  return (
    <div className="px-4 py-3 bg-white rounded-lg shadow-md border-2 border-blue-500 min-w-[200px] max-w-[250px]">
      <Handle type="target" position={Position.Top} />
      <div className="text-center">
        <div className="text-xs font-semibold text-blue-600 mb-2">{data.label}</div>
        <div className="text-xs text-gray-700 leading-relaxed">{data.message}</div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

const nodeTypes = {
  projectNode: ProjectNode,
}

// Helper function to check if two line segments intersect
function doLinesIntersect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): boolean {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x)
  if (d === 0) return false

  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d
  const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d

  return t > 0 && t < 1 && u > 0 && u < 1
}

// Generate a puzzle with nodes and edges
function generatePuzzle(): { nodes: Node[]; edges: Edge[] } {
  const nodeCount = Math.floor(Math.random() * 4) + 5 // Random between 3 and 6
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Shuffle project messages
  const shuffledMessages = [...projectMessages].sort(() => Math.random() - 0.5).slice(0, nodeCount)

  // Create nodes in a circle initially (will be scrambled)
  const radius = 150
  const centerX = 0
  const centerY = 0

  for (let i = 0; i < nodeCount; i++) {
    const angle = (2 * Math.PI * i) / nodeCount
    const x = centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 100
    const y = centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 100

    nodes.push({
      id: `n${i + 1}`,
      type: 'projectNode',
      position: { x, y },
      data: { 
        label: `Node ${i + 1}`,
        message: shuffledMessages[i] || projectMessages[i % projectMessages.length]
      },
      draggable: true,
    })
  }

  // Create edges that form a solvable puzzle
  // Connect nodes in a way that creates crossings when scrambled
  const connections: number[][] = []
  
  // Generate connections based on node count
  // For each node, connect to a few other nodes to create interesting puzzles
  for (let i = 0; i < nodeCount; i++) {
    // Connect to 2-3 other nodes
    const numConnections = nodeCount <= 3 ? 2 : Math.floor(Math.random() * 2) + 2
    const connected = new Set<number>()
    
    while (connected.size < numConnections) {
      const target = Math.floor(Math.random() * nodeCount)
      if (target !== i && !connected.has(target)) {
        connected.add(target)
        // Avoid duplicate connections
        const exists = connections.some(([from, to]) => 
          (from === i && to === target) || (from === target && to === i)
        )
        if (!exists) {
          connections.push([i, target])
        }
      }
    }
  }

  connections.forEach(([from, to], idx) => {
    edges.push({
      id: `e${idx + 1}`,
      source: `n${from + 1}`,
      target: `n${to + 1}`,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
    })
  })

  return { nodes, edges }
}

function UntangleGame() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const { fitView } = useReactFlow()

  // Initialize puzzle on mount and generate new one each time
  useEffect(() => {
    const puzzle = generatePuzzle()
    setNodes(puzzle.nodes)
    setEdges(puzzle.edges)
    setTimeout(() => fitView({ padding: 0.2 }), 100)
  }, []) // Empty dependency array means it runs once on mount (new puzzle on refresh)

  // Check for edge crossings
  const crossingEdges = useMemo(() => {
    const crossings: Set<string> = new Set()
    
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const edge1 = edges[i]
        const edge2 = edges[j]

        // Get node positions
        const node1 = nodes.find(n => n.id === edge1.source)
        const node2 = nodes.find(n => n.id === edge1.target)
        const node3 = nodes.find(n => n.id === edge2.source)
        const node4 = nodes.find(n => n.id === edge2.target)

        if (!node1 || !node2 || !node3 || !node4) continue

        // Check if edges share a node (they can't cross if they share a node)
        if (
          edge1.source === edge2.source ||
          edge1.source === edge2.target ||
          edge1.target === edge2.source ||
          edge1.target === edge2.target
        ) {
          continue
        }

        const p1 = { x: node1.position.x, y: node1.position.y }
        const p2 = { x: node2.position.x, y: node2.position.y }
        const p3 = { x: node3.position.x, y: node3.position.y }
        const p4 = { x: node4.position.x, y: node4.position.y }

        if (doLinesIntersect(p1, p2, p3, p4)) {
          crossings.add(edge1.id)
          crossings.add(edge2.id)
        }
      }
    }

    return crossings
  }, [nodes, edges])

  // Update edge colors based on crossings
  const styledEdges = useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      style: {
        ...edge.style,
        stroke: crossingEdges.has(edge.id) ? '#ef4444' : '#3b82f6',
        strokeWidth: 2,
      },
    }))
  }, [edges, crossingEdges])

  const onNodesChange = useCallback(
    (changes: any) => {
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot))
    },
    []
  )

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  )

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background id="1" gap={20} color="#404040" variant={BackgroundVariant.Dots} />
        <Controls />
      </ReactFlow>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="h-screen w-screen flex flex-col">
      <HomeTopNav />
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <UntangleGame />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
