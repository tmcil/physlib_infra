import {
  addEdge,
  ReactFlowProvider,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type XYPosition,
} from "@xyflow/react"
import { useCallback, useRef, type Dispatch, type SetStateAction } from "react"
import { v4 as uuid4 } from "uuid"

import blockList from "@/assets/block_list.json"
import type { BlockEdge } from "../edges"
import type { AppNode, BlockFlowNode } from "../nodes"
import {
  type CompilationIssue,
  type CompilationStatus,
} from "./compile"
import ReactFlowCanvas from "./react-flow-canvas"
import ReactFlowTools from "./react-flow-tools"

type ReactFlowEditorProps = {
  nodes: AppNode[]
  edges: BlockEdge[]
  setNodes: Dispatch<SetStateAction<AppNode[]>>
  setEdges: Dispatch<SetStateAction<BlockEdge[]>>
  onNodesChange: OnNodesChange<AppNode>
  onEdgesChange: OnEdgesChange<BlockEdge>
  onClearGraph: () => void
  onCompile: () => void
  compilationStatus: CompilationStatus
  compilationIssues: CompilationIssue[]
  isCompiled: boolean
  onRun: () => void
  isRunning: boolean
  runError: string | null
}

export default function ReactFlowEditor({
  nodes,
  edges,
  setNodes,
  setEdges,
  onNodesChange,
  onEdgesChange,
  onClearGraph,
  onCompile,
  compilationStatus,
  compilationIssues,
  isCompiled,
  onRun,
  isRunning,
  runError,
}: ReactFlowEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const handleAddEdge: OnConnect = useCallback((connection) => {
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
      addEdge<BlockEdge>(
        {
          ...connection,
          sourcePortType: sourcePort.type,
          targetPortType: targetPort.type,
        },
        currentEdges
      )
    )
  }, [nodes, setEdges])

  const handleAddBlock = useCallback((blockName: string, position: XYPosition) => {
    const block = blockList.blockGraph.find((item) => item.block === blockName)
    if (!block) {
      throw new Error(`Block "${blockName}" was not found in block_list.json`)
    }

    const newNode: BlockFlowNode = {
      id: uuid4(),
      type: "block",
      position,
      data: structuredClone(block),
    }

    setNodes((currentNodes) => [...currentNodes, newNode])
  }, [setNodes])

  return (
    <ReactFlowProvider>
      <div className="relative h-full w-full">
        <ReactFlowCanvas
          canvasRef={canvasRef}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleAddEdge}
        />
        <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2">
          <ReactFlowTools
            blockGraph={blockList.blockGraph}
            onSelectBlock={handleAddBlock}
            onClearGraph={onClearGraph}
            onCompile={onCompile}
            onRun={onRun}
            compilationStatus={compilationStatus}
            compilationIssues={compilationIssues}
            isCompiled={isCompiled}
            isRunning={isRunning}
            runError={runError}
            canvasRef={canvasRef}
          />
        </div>
      </div>
    </ReactFlowProvider>
  )
}
