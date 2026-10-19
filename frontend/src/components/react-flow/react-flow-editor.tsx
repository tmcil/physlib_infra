import { useCallback, useState } from "react"
import {
  addEdge,
  useEdgesState,
  useNodesState,
  type Edge,
  type OnConnect,
} from "@xyflow/react"
import { v4 as uuid4 } from "uuid"

import blockList from "@/assets/block_list.json"
import { initialEdges } from "./edges"
import type { AppNode, BlockFlowNode } from "./nodes"
import ReactFlowCanvas from "./react-flow-canvas"
import ReactFlowTools from "./react-flow-tools"

function createInitialNode(): AppNode {
  const block = blockList.blockGraph.find((item) => item.block === "BLOCK_INPUT_TIM")
  if (!block) {
    throw new Error('Block "BLOCK_SGP4" was not found in block_list.json')
  }

  return {
    id: uuid4(),
    type: "block",
    position: { x: 300, y: 100 },
    data: block,
  }
}

export default function ReactFlowEditor() {
  const [initialNodes] = useState<AppNode[]>(() => [createInitialNode()])
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges)

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((currentEdges) => addEdge(connection, currentEdges)),
    [setEdges]
  )

  const handleAddBlock = useCallback((blockName: string) => {
    const block = blockList.blockGraph.find((item) => item.block === blockName)
    if (!block) {
      throw new Error(`Block "${blockName}" was not found in block_list.json`)
    }

    setNodes((currentNodes) => {
      const newNodeCount = currentNodes.length - initialNodes.length
      const newNode: BlockFlowNode = {
        id: uuid4(),
        type: "block",
        position: {
          x: 100 + ((newNodeCount + 1) % 4) * 300,
          y: 100 + Math.floor(newNodeCount / 4) * 220,
        },
        data: structuredClone(block),
      }

      return [...currentNodes, newNode]
    })
  }, [initialNodes.length, setNodes])
  
  console.log("nodes:", nodes);
  console.log("edges:", edges);

  return (
    <div className="relative h-full w-full">
      <ReactFlowCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      />
      <div className="absolute left-3 top-3 z-10">
        <ReactFlowTools
          blockGraph={blockList.blockGraph}
          onSelectBlock={handleAddBlock}
        />
      </div>
    </div>
  )
}
