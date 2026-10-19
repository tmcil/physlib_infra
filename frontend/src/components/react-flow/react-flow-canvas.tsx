import "@xyflow/react/dist/style.css";
import { useCallback } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
} from "@xyflow/react";

import { nodeTypes } from "./nodes/index";
import { initialEdges, edgeTypes } from "./edges/index";
import blockList from "@/assets/block_list.json";
import { v4 as uuid4 } from "uuid";

function initNodeFromBlockList(blockName: string, position: { x: number; y: number }) {
  const block = blockList.blockGraph.find((item) => item.block === blockName);
  if (!block) throw new Error(`Block "${blockName}" was not found in block_list.json`);

  // Assign the block a UUID at creation
  return {
    id: uuid4(),
    type: "block",
    position,
    data: block,
  };
}

const exampleBlockNode = initNodeFromBlockList("BLOCK_INPUT_TIM", { x: 300, y: 100 });
console.log("exampleBlockNode:", JSON.stringify(exampleBlockNode, null, 2));

export default function ReactFlowCanvas() {

  // Right now the canvas owns the state, but we'll want to move it to the parent
  const [nodes, setNodes, onNodesChange] = useNodesState([exampleBlockNode]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((edges) => addEdge(connection, edges)),
    [setEdges]
  );

  return (
    <div className="w-full h-full">
    <ReactFlow
      nodes={nodes}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      edges={edges}
      edgeTypes={edgeTypes}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
    >
      <Background />
      <Controls />
    </ReactFlow>
    </div>
  );
}
