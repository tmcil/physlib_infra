import { useCallback, useState } from "react"
import {
  addEdge,
  useEdgesState,
  useNodesState,
  type Edge,
  type OnConnect,
  type XYPosition,
} from "@xyflow/react"
import { v4 as uuid4 } from "uuid"

import blockList from "@/assets/block_list.json"
import { initialEdges } from "./edges"
import type { AppNode, BlockFlowNode } from "./nodes"
import ReactFlowCanvas from "./react-flow-canvas"

export default function ReactFlowEditor() {
  const [initialNodes] = useState<AppNode[]>(() => [])
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges)

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((currentEdges) => addEdge(connection, currentEdges)),
    [setEdges]
  )

  const handleAddBlock = useCallback((blockName: string, position: XYPosition) => {
    const block = blockList.blockGraph.find((item) => item.block === blockName)
    if (!block) {
      throw new Error(`Block "${blockName}" was not found in block_list.json`)
    }

    setNodes((currentNodes) => {
      const newNode: BlockFlowNode = {
        id: uuid4(),
        type: "block",
        position,
        data: structuredClone(block),
      }

      return [...currentNodes, newNode]
    })
  }, [setNodes])
  
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
        blockGraph={blockList.blockGraph}
        onAddBlock={handleAddBlock}
      />
    </div>
  )
}
