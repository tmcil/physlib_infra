import type { XYPosition } from "@xyflow/react"

import blockList from "@/assets/block_list.json"
import type { BlockEdge } from "@/components/react-flow/edges"
import type { BlockConfigDefinition } from "@/components/react-flow/nodes/block-config"
import type { AppNode, BlockFlowNode } from "@/components/react-flow/nodes"
import { arePortTypesCompatible } from "@/lib/port-types"

export type BlockGraphConnection = {
  portId: string
  blockId: string
}

export type BlockGraphPort = {
  type: string
  array: boolean
  portId: string
  optional: boolean
  direction: "input" | "output"
  connections: BlockGraphConnection[]
}

export type BlockGraphBlock = {
  block: string
  ports: BlockGraphPort[]
  blockId: string
  position?: XYPosition
  config?: BlockConfigDefinition
}

export type BlockGraphDocument = {
  blockGraph: BlockGraphBlock[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isBlockGraphPort(value: unknown): value is BlockGraphPort {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.type === "string" &&
    typeof value.array === "boolean" &&
    typeof value.portId === "string" &&
    typeof value.optional === "boolean" &&
    (value.direction === "input" || value.direction === "output") &&
    Array.isArray(value.connections) &&
    value.connections.every(
      (connection) =>
        isRecord(connection) &&
        typeof connection.portId === "string" &&
        typeof connection.blockId === "string"
    )
  )
}

function isBlockConfig(value: unknown): value is BlockConfigDefinition {
  return (
    isRecord(value) &&
    Array.isArray(value.dateandtime) &&
    Array.isArray(value.check) &&
    Array.isArray(value.combo) &&
    Array.isArray(value.integer) &&
    Array.isArray(value.float) &&
    Array.isArray(value.string)
  )
}

function isBlockGraphBlock(value: unknown): value is BlockGraphBlock {
  if (!isRecord(value)) {
    return false
  }

  const hasValidPosition =
    value.position === undefined ||
    (isRecord(value.position) &&
      typeof value.position.x === "number" &&
      typeof value.position.y === "number")
  const hasValidConfig =
    value.config === undefined || isBlockConfig(value.config)

  return (
    typeof value.block === "string" &&
    typeof value.blockId === "string" &&
    Array.isArray(value.ports) &&
    value.ports.every(isBlockGraphPort) &&
    hasValidPosition &&
    hasValidConfig
  )
}

export function isBlockGraphDocument(
  value: unknown
): value is BlockGraphDocument {
  return isRecord(value) &&
    Array.isArray(value.blockGraph) &&
    value.blockGraph.every(isBlockGraphBlock)
}

function isBlockNode(node: AppNode): node is BlockFlowNode {
  return node.type === "block"
}

export function toBlockGraphDocument(
  nodes: AppNode[],
  edges: BlockEdge[]
): BlockGraphDocument {
  const blockGraph: BlockGraphBlock[] = nodes.map((node) => {
    if (!isBlockNode(node)) {
      throw new Error(`Cannot serialize unsupported node type "${node.type}".`)
    }

    return {
      block: node.data.block,
      blockId: node.id,
      position: { ...node.position },
      config: structuredClone(node.data.config),
      ports: node.data.ports.map((port) => {
        if (port.direction !== "input" && port.direction !== "output") {
          throw new Error(
            `Cannot serialize port "${port.portId}" with direction "${port.direction}".`
          )
        }

        return {
          type: port.type,
          array: port.array,
          portId: port.portId,
          optional: port.optional,
          direction: port.direction,
          connections: [],
        }
      }),
    }
  })
  const blocksById = new Map(blockGraph.map((block) => [block.blockId, block]))

  for (const edge of edges) {
    const source = blocksById.get(edge.source)
    const target = blocksById.get(edge.target)
    const sourcePort = source?.ports.find(
      (port) => port.portId === edge.sourceHandle && port.direction === "output"
    )
    const targetPort = target?.ports.find(
      (port) => port.portId === edge.targetHandle && port.direction === "input"
    )

    if (!source || !target || !sourcePort || !targetPort) {
      throw new Error(`Cannot serialize invalid edge "${edge.id}".`)
    }
    if (!arePortTypesCompatible(sourcePort.type, targetPort.type)) {
      throw new Error(`Cannot serialize edge "${edge.id}" between incompatible ports.`)
    }

    sourcePort.connections.push({
      portId: targetPort.portId,
      blockId: target.blockId,
    })
    targetPort.connections.push({
      portId: sourcePort.portId,
      blockId: source.blockId,
    })
  }

  return { blockGraph }
}

export function fromBlockGraphDocument(
  document: BlockGraphDocument
): { nodes: AppNode[]; edges: BlockEdge[] } {
  const blocksById = new Map(document.blockGraph.map((block) => [block.blockId, block]))
  const nodes: BlockFlowNode[] = document.blockGraph.map((block, index) => {
    const definition = blockList.blockGraph.find(
      (item) => item.block === block.block
    )

    if (!definition) {
      throw new Error(`Cannot load unknown block "${block.block}".`)
    }

    const ports = block.ports.map((port) => {
      const definitionPort = definition.ports.find(
        (item) => item.portId === port.portId
      )
      if (!definitionPort) {
        throw new Error(
          `Cannot load unknown port "${port.portId}" for block "${block.block}".`
        )
      }

      return { ...definitionPort, ...port }
    })

    return {
      id: block.blockId,
      type: "block",
      position: block.position ?? { x: index * 250, y: 0 },
      data: {
        ...structuredClone(definition),
        ports,
        config: structuredClone(block.config ?? definition.config),
      },
    }
  })
  const edges: BlockEdge[] = []

  for (const source of document.blockGraph) {
    for (const sourcePort of source.ports) {
      if (sourcePort.direction !== "output") {
        continue
      }

      for (const connection of sourcePort.connections) {
        const target = blocksById.get(connection.blockId)
        const targetPort = target?.ports.find(
          (port) =>
            port.portId === connection.portId && port.direction === "input"
        )

        if (!target || !targetPort) {
          throw new Error(
            `Cannot load connection from "${source.blockId}.${sourcePort.portId}" to "${connection.blockId}.${connection.portId}".`
          )
        }
        if (!arePortTypesCompatible(sourcePort.type, targetPort.type)) {
          throw new Error(
            `Cannot load connection between incompatible ports "${sourcePort.portId}" and "${targetPort.portId}".`
          )
        }

        edges.push({
          id: `edge-${edges.length}`,
          source: source.blockId,
          sourceHandle: sourcePort.portId,
          sourcePortType: sourcePort.type,
          target: target.blockId,
          targetHandle: targetPort.portId,
          targetPortType: targetPort.type,
        })
      }
    }
  }

  return { nodes, edges }
}
