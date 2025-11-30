"use client"

import { HomeTopNav } from "@/components/navigation/HomeTopNav"
import { useState, useCallback, useEffect } from 'react'
import { ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges, BackgroundVariant, ReactFlowProvider, useReactFlow, type Node, type Edge, Handle, Position } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { colorPalette, colors } from '@/lib/colors'

const TWIGGLE_LETTERS = ['T', 'W', 'I', 'G', 'G', 'L', 'E'] as const

function LetterNode({ data }: { data: { letter: string; index: number; color: string } }) {
  return (
    <div 
      className="w-16 h-16 bg-white rounded-lg shadow-md border-2 flex items-center justify-center"
      style={{ borderColor: data.color }}
    >
      <Handle type="target" position={Position.Left} />
      <div className="text-3xl font-bold" style={{ color: data.color }}>{data.letter}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

const nodeTypes = {
  letterNode: LetterNode,
}

function generateTwiggleGame(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const rows = [-200, 0, 200]
  
  const columnConstraints = [
    -200,
    -200,
    Math.random() < 0.5 ? -200 : 0,
    0,
    Math.random() < 0.5 ? 0 : 200,
    200,
    200,
  ]

  const usedPositions = new Set<string>()
  
  // Fixed positions: T (index 0) at top-left, E (index 6) at bottom-right
  const T_POSITION = { x: -200, y: -200 } // Top-left corner
  const E_POSITION = { x: 200, y: 200 }   // Bottom-right corner
  
  // Reserve these positions
  usedPositions.add(`${T_POSITION.x},${T_POSITION.y}`)
  usedPositions.add(`${E_POSITION.x},${E_POSITION.y}`)
  
  // Ensure all 4 colors appear at least once
  const shuffledColors = [...colorPalette].sort(() => Math.random() - 0.5)
  const remainingColors: string[] = []
  
  // For the remaining nodes (7 letters - 4 colors = 3 remaining), add random colors
  for (let i = 0; i < TWIGGLE_LETTERS.length - colorPalette.length; i++) {
    remainingColors.push(colorPalette[Math.floor(Math.random() * colorPalette.length)])
  }
  
  // Combine: first 4 colors (one of each) + remaining random colors
  const allColors = [...shuffledColors, ...remainingColors].sort(() => Math.random() - 0.5)

  for (let i = 0; i < TWIGGLE_LETTERS.length; i++) {
    let x: number
    let y: number
    
    // T node (index 0) always at top-left
    if (i === 0) {
      x = T_POSITION.x
      y = T_POSITION.y
    }
    // E node (index 6) always at bottom-right
    else if (i === 6) {
      x = E_POSITION.x
      y = E_POSITION.y
    }
    // Other nodes: use column constraints and available rows
    else {
      x = columnConstraints[i]
      
      const availableRows = rows.filter(row => {
        const positionKey = `${x},${row}`
        return !usedPositions.has(positionKey)
      })
      
      const shuffledRows = availableRows.length > 0 
        ? [...availableRows].sort(() => Math.random() - 0.5)
        : rows
      
      y = shuffledRows[0]
      const positionKey = `${x},${y}`
      usedPositions.add(positionKey)
    }
    
    // Assign color ensuring all 4 appear at least once
    const nodeColor = allColors[i]
    
    nodes.push({
      id: `letter-${i}`,
      type: 'letterNode',
      position: { x, y },
      data: {
        letter: TWIGGLE_LETTERS[i],
        index: i,
        color: nodeColor,
      },
      draggable: true,
    })
  }

  for (let i = 0; i < TWIGGLE_LETTERS.length - 1; i++) {
    edges.push({
      id: `edge-${i}`,
      source: `letter-${i}`,
      target: `letter-${i + 1}`,
      style: { stroke: colors.darkGray, strokeWidth: 2 },
    })
  }

  return { nodes, edges }
}

function TwiggleGame() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const { fitView } = useReactFlow()

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
            backgroundColor: 'rgba(17, 138, 178, 0.7)',
            borderRadius: '8px',
            border: '1px solid rgba(17, 138, 178, 0.1)',
          }}
        />
      </ReactFlow>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      <HomeTopNav />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative bg-[#eeeeee]">
          <ReactFlowProvider>
            <TwiggleGame />
          </ReactFlowProvider>
        </div>
        <div className="w-1/3 bg-white p-8 border-l border-gray-200 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Twiggle</h1>
            <p className="text-xl text-gray-800 mb-8 leading-relaxed font-medium italic">
              Unify your work. Amplify your productivity.
            </p>
            <div className="space-y-6 text-gray-700">
              <p className="leading-relaxed">
                Twiggle revolutionizes how you work by unifying documents, spreadsheets, presentations, and files into a single, intelligent workspace. Break free from app-switching and fragmented workflows—everything you need is connected, accessible, and organized in one powerful platform.
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="text-gray-900 font-semibold mb-2">Enterprise Teams</h3>
                  <p className="leading-relaxed text-sm">
                    Streamline business operations with integrated document management, collaborative data analysis, and seamless presentation workflows. Connect your entire knowledge base in a unified ecosystem that scales with your organization.
                  </p>
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold mb-2">Academic Excellence</h3>
                  <p className="leading-relaxed text-sm">
                    Transform how students learn and organize. Link research, notes, assignments, and study materials in an intuitive visual workspace that enhances comprehension and accelerates academic success.
                  </p>
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold mb-2">Research Innovation</h3>
                  <p className="leading-relaxed text-sm">
                    Accelerate discovery by connecting papers, datasets, notes, and insights. Build visual knowledge graphs that reveal relationships between ideas, making complex research more navigable and impactful.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="leading-relaxed text-gray-600 mt-6 pt-6 border-t border-gray-200 text-sm flex-shrink-0">
            The convergence of productivity tools—documents, spreadsheets, presentations, and file management—reimagined as one cohesive, intelligent workspace where every connection matters.
          </p>
        </div>
      </div>
    </div>
  )
}
