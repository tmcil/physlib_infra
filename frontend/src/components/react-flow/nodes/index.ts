import type { Node, NodeTypes, BuiltInNode } from "@xyflow/react";
import { PositionLoggerNode } from "./PositionLoggerNode";
import { BlockNode, type BlockDefinition, type BlockFlowNode } from "./block-node";
import { v4 as uuid4 } from "uuid";

export type { BlockDefinition, BlockFlowNode };

export function blockToNode(block: BlockDefinition, position = { x: 0, y: 0 }): BlockFlowNode {
  return {
    id: uuid4(),
    type: "block",
    position,
    data: block,
  };
}

export type PositionLoggerNode = Node<
  {
    label?: string;
  },
  "position-logger"
>;

export type AppNode = BuiltInNode | PositionLoggerNode | BlockFlowNode;

export const nodeTypes = {
  "position-logger": PositionLoggerNode,
  block: BlockNode,
  // Add any of your custom nodes here!
} satisfies NodeTypes;
