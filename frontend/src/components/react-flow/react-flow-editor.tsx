import { useCallback, useState } from "react"
import {
  addEdge,
  useEdgesState,
  useNodesState,
  type OnConnect,
  type XYPosition,
} from "@xyflow/react"
import { v4 as uuid4 } from "uuid"

import blockList from "@/assets/block_list.json"
import { initialEdges, type BlockEdge } from "./edges"
import type { AppNode, BlockFlowNode } from "./nodes"
import ReactFlowCanvas from "./react-flow-canvas"

export default function ReactFlowEditor() {
  const [initialNodes] = useState<AppNode[]>(() => [])
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<BlockEdge>(initialEdges)

  const onConnect: OnConnect = useCallback(
    (connection) => {
      const sourceNode = nodes.find(
        (node): node is BlockFlowNode =>
          node.id === connection.source && node.type === "block"
      )
      const targetNode = nodes.find(
        (node): node is BlockFlowNode =>
          node.id === connection.target && node.type === "block"
      )
      const sourcePort = sourceNode?.data.ports.find(
        (port) => port.portId === connection.sourceHandle && port.direction === "output"
      )
      const targetPort = targetNode?.data.ports.find(
        (port) => port.portId === connection.targetHandle && port.direction === "input"
      )

      if (!sourcePort || !targetPort) {
        throw new Error("Could not find the source and target ports for this connection")
      }

      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            sourcePortType: sourcePort.type,
            targetPortType: targetPort.type,
          },
          currentEdges
        )
      )
    },
    [nodes, setEdges]
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
