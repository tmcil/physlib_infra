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

import { blockToNode, nodeTypes } from "./nodes/index";
import { initialEdges, edgeTypes } from "./edges/index";
import blockList from "@/assets/block_list.json";

function createBlockNode(blockName: string, position: { x: number; y: number }) {
  const block = blockList.blockGraph.find((item) => item.block === blockName);

  if (!block) {
    throw new Error(`Block "${blockName}" was not found in block_list.json`);
  }

  return blockToNode(block, position);
}

const exampleBlockNode = createBlockNode("BLOCK_INPUT_TIM", { x: 300, y: 100 });
console.log("exampleBlockNode:", JSON.stringify(exampleBlockNode, null, 2));

export default function ReactFlowTest() {
  const [nodes, , onNodesChange] = useNodesState([exampleBlockNode]);
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
