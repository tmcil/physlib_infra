import { useCallback } from "react"
import {
    addEdge,
    useEdgesState,
    useNodesState,
    type OnConnect,
    type XYPosition,
} from "@xyflow/react"
import { v4 as uuid4 } from "uuid"

import blockList from "@/assets/block_list.json"
import ReactFlowEditor from "@/components/react-flow/editor/react-flow-editor"
import type { BlockEdge } from "@/components/react-flow/edges"
import type { AppNode, BlockFlowNode } from "@/components/react-flow/nodes"

export default function AnalysisEditor() {
    const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<BlockEdge>([])

    const onConnect: OnConnect = useCallback(
        (connection) => {
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
                addEdge(
                    {
                        ...connection,
                        sourcePortType: sourcePort.type,
                        targetPortType: targetPort.type,
                    },
                    currentEdges
                )
            )
        },
        [nodes, setEdges]
    )

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

    const handleClearGraph = useCallback(() => {
        setNodes([])
        setEdges([])
    }, [setEdges, setNodes])

    console.log("nodes:", nodes);
    console.log("edges:", edges);

    return (
      <div className="flex w-full max-w-3xl h-[400px] flex-col border rounded-sm p-6">
            <ReactFlowEditor
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onAddBlock={handleAddBlock}
                onClearGraph={handleClearGraph}
            />
        </div>
    )
}
