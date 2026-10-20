import "@xyflow/react/dist/style.css";
import type { RefObject } from "react"
import {
  Background,
  ReactFlow,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";

import { nodeTypes, type AppNode } from "../nodes/index";
import { edgeTypes, type BlockEdge } from "../edges/index";

type ReactFlowCanvasProps = {
  canvasRef: RefObject<HTMLDivElement | null>
  nodes: AppNode[]
  edges: BlockEdge[]
  onNodesChange: OnNodesChange<AppNode>
  onEdgesChange: OnEdgesChange<BlockEdge>
  onConnect: OnConnect
}

export default function ReactFlowCanvas({
  canvasRef,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
}: ReactFlowCanvasProps) {
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
      </ReactFlow>
    </div>
  );
}
