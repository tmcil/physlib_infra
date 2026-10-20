import type { Edge, EdgeTypes } from "@xyflow/react";

export type BlockEdge = Edge & {
  sourcePortType: string;
  targetPortType: string;
};

export const initialEdges = [

] satisfies BlockEdge[];

export const edgeTypes = {
  // Add your custom edge types here!
} satisfies EdgeTypes;
