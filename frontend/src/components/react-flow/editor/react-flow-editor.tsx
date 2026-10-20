import {
  ReactFlowProvider,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type XYPosition,
} from "@xyflow/react"
import { useEffect, useRef, useState } from "react"

import blockList from "@/assets/block_list.json"
import type { BlockEdge } from "../edges"
import type { AppNode } from "../nodes"
import {
  compileGraph,
  getGraphFingerprint,
  type CompilationIssue,
} from "./compile"
import ReactFlowCanvas from "./react-flow-canvas"
import ReactFlowTools from "./react-flow-tools"

type CompilationStatus = "idle" | "compiling" | "success" | "failed"

type ReactFlowEditorProps = {
  nodes: AppNode[]
  edges: BlockEdge[]
  onNodesChange: OnNodesChange<AppNode>
  onEdgesChange: OnEdgesChange<BlockEdge>
  onConnect: OnConnect
  onAddBlock: (blockName: string, position: XYPosition) => void
  onClearGraph: () => void
  onRun: () => void
  isRunning: boolean
  runError: string | null
}

export default function ReactFlowEditor({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddBlock,
  onClearGraph,
  onRun,
  isRunning,
  runError,
}: ReactFlowEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const compileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [compilationStatus, setCompilationStatus] =
    useState<CompilationStatus>("idle")
  const [compilationIssues, setCompilationIssues] = useState<CompilationIssue[]>([])
  const [lastSuccessfulCompile, setLastSuccessfulCompile] = useState<string | null>(null)
  const isCompiled = lastSuccessfulCompile === getGraphFingerprint(nodes, edges)

  function handleCompile() {
    if (compilationStatus === "compiling" || isCompiled) {
      return
    }

    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current)
    }
    setCompilationIssues([])
    setCompilationStatus("compiling")
    const compiledFingerprint = getGraphFingerprint(nodes, edges)
    compileTimerRef.current = setTimeout(() => {
      const result = compileGraph(nodes, edges)
      console.log("Compilation result:", result)
      setCompilationIssues(result.issues)
      setCompilationStatus(result.success ? "success" : "failed")

      if (result.success) {
        setLastSuccessfulCompile(compiledFingerprint)
        successTimerRef.current = setTimeout(() => {
          setCompilationStatus("idle")
        }, 1200)
      }
    }, 120)
  }

  useEffect(() => {
    return () => {
      if (compileTimerRef.current) {
        clearTimeout(compileTimerRef.current)
      }
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
      }
    }
  }, [])

  function handleClearGraph() {
    if (compileTimerRef.current) {
      clearTimeout(compileTimerRef.current)
    }
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current)
    }
    setCompilationStatus("idle")
    setCompilationIssues([])
    onClearGraph()
  }

  return (
    <ReactFlowProvider>
      <div className="relative h-full w-full">
        <ReactFlowCanvas
          canvasRef={canvasRef}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        />
        <div className="absolute left-2 top-2 z-10">
          <ReactFlowTools
            blockGraph={blockList.blockGraph}
            onSelectBlock={onAddBlock}
            onClearGraph={handleClearGraph}
            onCompile={handleCompile}
            onRun={onRun}
            compilationStatus={compilationStatus}
            compilationIssues={compilationIssues}
            isCompiled={isCompiled}
            isRunning={isRunning}
            runError={runError}
            canvasRef={canvasRef}
          />
        </div>
      </div>
    </ReactFlowProvider>
  )
}
