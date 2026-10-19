import "@xyflow/react/dist/style.css";
import { useRef } from "react"
import {
  Background,
  Panel,
  ReactFlow,
  type Edge,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type XYPosition,
} from "@xyflow/react";

import { nodeTypes, type AppNode } from "./nodes/index";
import { edgeTypes } from "./edges/index";
import ReactFlowTools from "./react-flow-tools";

type BlockGraphItem = {
  block: string
  blockName: string
  type: string
}

type ReactFlowCanvasProps = {
  nodes: AppNode[]
  edges: Edge[]
  onNodesChange: OnNodesChange<AppNode>
  onEdgesChange: OnEdgesChange<Edge>
  onConnect: OnConnect
  blockGraph: BlockGraphItem[]
  onAddBlock: (blockName: string, position: XYPosition) => void
}

export default function ReactFlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  blockGraph,
  onAddBlock,
}: ReactFlowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={canvasRef} className="w-full h-full">
      <ReactFlow
        className="react-flow-theme"
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        edges={edges}
        edgeTypes={edgeTypes}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        deleteKeyCode={["Backspace", "Delete"]}
        nodeOrigin={[0.5, 0.5]}
        fitView
      >
        <Background />
        <Panel position="top-left">
          <ReactFlowTools
            blockGraph={blockGraph}
            onSelectBlock={onAddBlock}
            canvasRef={canvasRef}
          />
        </Panel>
      </ReactFlow>
    </div>
  );
}
