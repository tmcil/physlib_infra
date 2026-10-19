import type { Node, NodeTypes, BuiltInNode } from "@xyflow/react";
import { PositionLoggerNode } from "./PositionLoggerNode";
import { BlockNode, type BlockDefinition, type BlockFlowNode } from "./block-node";

export type { BlockDefinition, BlockFlowNode };

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
