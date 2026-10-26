import { useCallback, useState, useEffect, useRef } from "react"
import {
    useEdgesState,
    useNodesState,
} from "@xyflow/react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import ReactFlowEditor from "@/components/react-flow/editor/react-flow-editor"
import type { BlockEdge } from "@/components/react-flow/edges"
import type { AppNode } from "@/components/react-flow/nodes"
import {
    compileGraph,
    getGraphFingerprint,
    type CompilationIssue,
    type CompilationStatus,
} from "@/components/react-flow/editor/compile"
import {
    createPublicExecution,
    getTemplateExecution,
    patchPublicExecution,
    runPublicExecution,
} from "@/lib/public-execution-api"
import Logs, { type LogsHandle } from "@/components/websockets/logs"
import Results, { type ResultsHandle } from "@/components/websockets/results"

export type PublicEditorProps = {
    executionId: string
    executionName: string
}

export default function PublicEditor({
  executionId,
  executionName,
}: PublicEditorProps) {
    const [activeTab, setActiveTab] = useState("Analysis")
    const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<BlockEdge>([])
    const [compilationStatus, setCompilationStatus] =
        useState<CompilationStatus>("idle")
    const [compilationIssues, setCompilationIssues] = useState<CompilationIssue[]>([])
    const [lastSuccessfulCompile, setLastSuccessfulCompile] = useState<string | null>(null)
    const [savedExecutionId, setSavedExecutionId] = useState<string | null>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [runError, setRunError] = useState<string | null>(null)
    const compileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const logsRef = useRef<LogsHandle>(null)
    const resultsRef = useRef<ResultsHandle>(null)
    const isCompiled = lastSuccessfulCompile === getGraphFingerprint(nodes, edges)

    // Load the initial state from the database
    useEffect(() => {
        async function loadTemplate() {
            try {
                const template = await getTemplateExecution(executionId)
                setNodes(template.nodes)
                setEdges(template.edges)
            } catch (error) {
                setRunError(
                    error instanceof Error ? error.message : "Failed to load template"
                )
            }
        }

        loadTemplate()
    }, [executionId, setNodes, setEdges])

    // Used to clear subcomponents when component unmounts
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

    // Used to set a timeout on the run error dialog
    useEffect(() => {
        if (runError === null) {
            return
        }

        const timer = setTimeout(() => setRunError(null), 5000)
        return () => clearTimeout(timer)
    }, [runError])

    // Handle compilations
    const handleCompile = useCallback(() => {
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
            async function compileAndSave() {
                const result = compileGraph(nodes, edges)
                setCompilationIssues(result.issues)
                if (!result.success) {
                    setCompilationStatus("failed")
                    return
                }

                setRunError(null)
                try {
                    const payload = { name: executionName, nodes, edges }
                    const response = savedExecutionId
                        ? await patchPublicExecution(savedExecutionId, payload)
                        : await createPublicExecution(payload)

                    setSavedExecutionId(response.id)
                    setLastSuccessfulCompile(compiledFingerprint)
                    setCompilationStatus("success")
                    successTimerRef.current = setTimeout(() => {
                        setCompilationStatus("idle")
                    }, 1200)
                } catch (error) {
                    setRunError(
                        error instanceof Error
                            ? error.message
                            : "Failed to save execution."
                    )
                    setCompilationStatus("failed")
                }
            }

            void compileAndSave()
        }, 120)
    }, [
        compilationStatus,
        edges,
        executionName,
        isCompiled,
        nodes,
        savedExecutionId,
    ])

    // Handle clearing the graph
    const handleClearGraph = useCallback(() => {
        if (compileTimerRef.current) {
            clearTimeout(compileTimerRef.current)
        }
        if (successTimerRef.current) {
            clearTimeout(successTimerRef.current)
        }
        setCompilationStatus("idle")
        setCompilationIssues([])
        setLastSuccessfulCompile(null)
        setNodes([])
        setEdges([])
        setRunError(null)
    }, [setEdges, setNodes])

    // Handle running the graph
    const handleRun = useCallback(async () => {
        if (isRunning) {
            return
        }

        setIsRunning(true)
        setRunError(null)
        setActiveTab("Logs")
        try {
            if (!savedExecutionId) {
                throw new Error("Compile the graph before running it.")
            }
            const logs = logsRef.current
            if (!logs) {
                throw new Error("The logs viewer is unavailable.")
            }
            const results = resultsRef.current
            if (!results) {
                throw new Error("The results viewer is unavailable.")
            }
            await Promise.all([
                logs.connect(savedExecutionId),
                results.connect(savedExecutionId),
            ])
            await runPublicExecution(savedExecutionId)
        } catch (error) {
            setRunError(
                error instanceof Error ? error.message : "Failed to schedule analysis."
            )
        } finally {
            setIsRunning(false)
        }
    }, [isRunning, savedExecutionId])

    console.log("nodes:", nodes);
    console.log("edges:", edges);

    return (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(String(value))} className="flex w-full max-w-3xl h-[500px] min-h-0 flex-col overflow-hidden border rounded-sm p-2">
            <TabsList>
                <TabsTrigger value="Analysis">Analysis</TabsTrigger>
                <TabsTrigger value="Logs">Logs</TabsTrigger>
                <TabsTrigger value="Results">Results</TabsTrigger>
            </TabsList>
            <TabsContent value="Analysis">
                <div defaultValue="Analysis" className="flex w-full h-full flex-col border rounded-sm p-1">
                    <ReactFlowEditor
                        nodes={nodes}
                        edges={edges}
                        setNodes={setNodes}
                        setEdges={setEdges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onClearGraph={handleClearGraph}
                        onCompile={handleCompile}
                        compilationStatus={compilationStatus}
                        compilationIssues={compilationIssues}
                        isCompiled={isCompiled}
                        onRun={handleRun}
                        isRunning={isRunning}
                        runError={runError}
                    />
                </div>
            </TabsContent>
            <TabsContent value="Logs" keepMounted className="min-h-0 overflow-hidden">
                <div className="flex h-full min-h-0 w-full flex-col overflow-hidden border rounded-sm p-0">
                    <Logs ref={logsRef} />
                </div>
            </TabsContent>
            <TabsContent value="Results" keepMounted className="min-h-0 overflow-hidden">
                <div className="flex h-full min-h-0 w-full flex-col overflow-hidden border rounded-sm p-0">
                    <Results ref={resultsRef} />
                </div>
            </TabsContent>
        </Tabs>
    )
}
