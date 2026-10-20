import type { BlockEdge } from "../edges"
import type { AppNode, BlockFlowNode } from "../nodes"

export type CompilationIssue =
  | {
      type: "invalid-edge"
      edgeId: string
      message: string
    }
  | {
      type: "edge-type-mismatch"
      edgeId: string
      message: string
    }
  | {
      type: "unconnected-required-port"
      nodeId: string
      portId: string
      message: string
    }

export type CompilationResult = {
  success: boolean
  issues: CompilationIssue[]
}

export function getGraphFingerprint(nodes: AppNode[], edges: BlockEdge[]): string {
  return JSON.stringify({
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      type: edge.type,
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      sourcePortType: edge.sourcePortType,
      target: edge.target,
      targetHandle: edge.targetHandle,
      targetPortType: edge.targetPortType,
    })),
  })
}

function isBlockNode(node: AppNode | undefined): node is BlockFlowNode {
  return node?.type === "block"
}

export function compileGraph(
  nodes: AppNode[],
  edges: BlockEdge[]
): CompilationResult {
  const issues: CompilationIssue[] = []

  for (const edge of edges) {
    const sourceNode = nodes.find((node) => node.id === edge.source)
    const targetNode = nodes.find((node) => node.id === edge.target)
    const sourcePort = isBlockNode(sourceNode)
      ? sourceNode.data.ports.find(
          (port) => port.portId === edge.sourceHandle && port.direction === "output"
        )
      : undefined
    const targetPort = isBlockNode(targetNode)
      ? targetNode.data.ports.find(
          (port) => port.portId === edge.targetHandle && port.direction === "input"
        )
      : undefined

    if (!sourcePort || !targetPort) {
      issues.push({
        type: "invalid-edge",
        edgeId: edge.id,
        message: `Edge "${edge.id}" does not connect a valid output port to an input port.`,
      })
      continue
    }

    if (
      sourcePort.type !== targetPort.type ||
      edge.sourcePortType !== sourcePort.type ||
      edge.targetPortType !== targetPort.type
    ) {
      issues.push({
        type: "edge-type-mismatch",
        edgeId: edge.id,
        message: `Edge "${edge.id}" connects incompatible port types "${sourcePort.type}" and "${targetPort.type}".`,
      })
    }
  }

  for (const node of nodes) {
    if (!isBlockNode(node)) {
      continue
    }

    for (const port of node.data.ports) {
      if (port.optional) {
        continue
      }

      const isConnected = edges.some((edge) => {
        if (port.direction === "input") {
          return edge.target === node.id && edge.targetHandle === port.portId
        }
        if (port.direction === "output") {
          return edge.source === node.id && edge.sourceHandle === port.portId
        }
        return false
      })

      if (!isConnected) {
        issues.push({
          type: "unconnected-required-port",
          nodeId: node.id,
          portId: port.portId,
          message: `Required ${port.direction} port "${port.type}" on node "${node.id}" is not connected.`,
        })
      }
    }
  }

  return {
    success: issues.length === 0,
    issues,
  }
}