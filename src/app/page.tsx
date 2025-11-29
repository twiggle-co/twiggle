"use client"

import { HomeTopNav } from "@/components/navigation/HomeTopNav"
import { useState, useCallback, useEffect, useMemo } from 'react'
import { ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges, BackgroundVariant, ReactFlowProvider, useReactFlow, type Node, type Edge, Handle, Position } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// Letters for TWIGGLE game
const TWIGGLE_LETTERS = ['T', 'W', 'I', 'G', 'G', 'L', 'E'] as const

// Custom node component displaying a letter
function LetterNode({ data }: { data: { letter: string; index: number } }) {
  return (
    <div className="w-16 h-16 bg-white rounded-lg shadow-md border-2 border-blue-500 flex items-center justify-center">
      <Handle type="target" position={Position.Left} />
      <div className="text-3xl font-bold text-blue-600">{data.letter}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

const nodeTypes = {
  letterNode: LetterNode,
}

// Generate TWIGGLE game with 7 nodes in random positions
function generateTwiggleGame(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Create 7 nodes with letters from TWIGGLE in random positions
  const minDistance = 200 // Minimum distance between nodes
  const positions: { x: number; y: number }[] = []

  for (let i = 0; i < TWIGGLE_LETTERS.length; i++) {
    let x = 0
    let y = 0
    let attempts = 0
    let validPosition = false

    // Try to find a position that's not too close to existing nodes
    while (!validPosition && attempts < 50) {
      x = (Math.random() - 0.5) * 800 // Random x between -400 and 400
      y = (Math.random() - 0.5) * 600 // Random y between -300 and 300

      // Check if position is far enough from existing nodes
      validPosition = positions.every(pos => {
        const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2))
        return distance >= minDistance
      })

      attempts++
    }

    // If we couldn't find a good position, use a fallback
    if (!validPosition) {
      const angle = (2 * Math.PI * i) / TWIGGLE_LETTERS.length
      const radius = 200
      x = radius * Math.cos(angle)
      y = radius * Math.sin(angle)
    }

    positions.push({ x, y })

    nodes.push({
      id: `letter-${i}`,
      type: 'letterNode',
      position: { x, y },
      data: {
        letter: TWIGGLE_LETTERS[i],
        index: i,
      },
      draggable: true,
    })
  }

  // Create edges connecting letters in order: T -> W -> I -> G -> G -> L -> E
  for (let i = 0; i < TWIGGLE_LETTERS.length - 1; i++) {
    edges.push({
      id: `edge-${i}`,
      source: `letter-${i}`,
      target: `letter-${i + 1}`,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
    })
  }

  return { nodes, edges }
}

function TwiggleGame() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const { fitView } = useReactFlow()

  // Initialize game on mount
  useEffect(() => {
    const game = generateTwiggleGame()
    setNodes(game.nodes)
    setEdges(game.edges)
    setTimeout(() => fitView({ padding: 0.2 }), 100)
  }, [fitView])

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
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background id="1" gap={20} color="#404040" variant={BackgroundVariant.Dots} />
        <Controls 
          style={{
            backgroundColor: 'rgba(123, 164, 244, 0.7)',
            borderRadius: '8px',
            border: '1px solid rgba(123, 164, 244, 0.1)',
          }}
        />
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
          <TwiggleGame />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
