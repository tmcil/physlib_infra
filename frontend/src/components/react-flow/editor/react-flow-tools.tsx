import { useState } from "react"
import { SquarePlus, Trash2 } from "lucide-react"
import { useReactFlow, type XYPosition } from "@xyflow/react"
import type { RefObject } from "react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Progress } from "@/components/ui/progress"
import type { CompilationIssue } from "./compile"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

type BlockGraphItem = {
  block: string
  blockName: string
  type: string
}

type ReactFlowToolsProps = {
  blockGraph: BlockGraphItem[]
  onSelectBlock: (block: string, position: XYPosition) => void
  onClearGraph: () => void
  onCompile: () => void
  onRun: () => void
  compilationStatus: "idle" | "compiling" | "success" | "failed"
  compilationIssues: CompilationIssue[]
  isCompiled: boolean
  isRunning: boolean
  runError: string | null
  canvasRef: RefObject<HTMLDivElement | null>
}

type BlockCommandProps = Omit<
  ReactFlowToolsProps,
  | "onCompile"
  | "onClearGraph"
  | "compilationStatus"
  | "compilationIssues"
  | "isCompiled"
  | "onRun"
  | "isRunning"
  | "runError"
>

type CompilationFeedbackProps = Pick<
  ReactFlowToolsProps,
  "compilationStatus" | "compilationIssues"
>

const blockGroups = [
  { type: "input", heading: "Input Blocks" },
  { type: "process", heading: "Process Blocks" },
  { type: "output", heading: "Output Blocks" },
] as const

function BlockCommand({
  blockGraph,
  onSelectBlock,
  canvasRef,
}: BlockCommandProps) {
  const [open, setOpen] = useState(false)
  const { screenToFlowPosition } = useReactFlow()

  function handleSelectBlock(blockName: string) {
    const canvasElement = canvasRef.current
    if (!canvasElement) {
      throw new Error("Cannot add a block because the React Flow canvas is unavailable")
    }

    const bounds = canvasElement.getBoundingClientRect()
    const position = screenToFlowPosition({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    })
    onSelectBlock(blockName, position)
  }

  return (
    <>
      <Button
        variant="secondary"
        size="default"
        aria-label="Add block"
        onClick={() => setOpen(true)}
      >
        <SquarePlus data-icon="inline-start" color="#0ba800" />
        Add block
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Add block"
        description="Search available blocks"
      >
        <Command>
          <CommandInput placeholder="Search blocks..." />
          <CommandList className="max-h-[40vh] overflow-y-auto">
            <CommandEmpty>No blocks found.</CommandEmpty>
            {blockGroups.map(({ type, heading }) => {
              const blocks = blockGraph.filter((block) => block.type === type)
              if (blocks.length === 0) return null

              return (
                <CommandGroup key={type} heading={heading}>
                  {blocks.map((block) => (
                    <CommandItem
                      key={block.block}
                      value={block.blockName}
                      onSelect={() => {
                        handleSelectBlock(block.block)
                        setOpen(false)
                      }}
                    >
                      {block.blockName}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}

function CompilationFeedback({
  compilationStatus,
  compilationIssues,
}: CompilationFeedbackProps) {
  if (compilationStatus === "idle") {
    return null
  }

  return (
    <>
      <Progress
        value={compilationStatus === "compiling" ? 35 : 100}
        aria-label="Graph compilation"
        className={`w-full gap-0 [&_[data-slot=progress-track]]:h-1.5 ${
          compilationStatus === "compiling"
            ? "[&_[data-slot=progress-indicator]]:animate-pulse"
            : compilationStatus === "failed"
              ? "[&_[data-slot=progress-indicator]]:bg-destructive"
              : "[&_[data-slot=progress-indicator]]:bg-green-600"
        }`}
      />
      {compilationStatus === "failed" && compilationIssues.length > 0 && (
        <details className="w-full rounded-md border bg-background text-sm">
          <summary className="cursor-pointer px-2 py-1 font-medium">
            Compilation errors ({compilationIssues.length})
          </summary>
          <pre className="max-h-48 overflow-auto border-t bg-muted p-2 font-mono text-xs whitespace-pre-wrap">
            {compilationIssues.map((issue) => issue.message).join("\n")}
          </pre>
        </details>
      )}
    </>
  )
}

export default function ReactFlowTools({
  blockGraph,
  onSelectBlock,
  onClearGraph,
  onCompile,
  onRun,
  compilationStatus,
  compilationIssues,
  isCompiled,
  isRunning,
  runError,
  canvasRef,
}: ReactFlowToolsProps) {
  return (
    <div className="flex w-max flex-col gap-1">
      <ButtonGroup aria-label="Canvas actions">
        <ButtonGroup>
          <BlockCommand
            blockGraph={blockGraph}
            onSelectBlock={onSelectBlock}
            canvasRef={canvasRef}
          />
          <Button variant="secondary" aria-label="Clear graph" onClick={onClearGraph}>
            <Trash2 data-icon="inline-start" color="#db0000" />
            Clear
          </Button>
        </ButtonGroup>
        <ButtonGroup className="hidden sm:block">
          <Button
            variant="secondary"
            onClick={onCompile}
            disabled={compilationStatus === "compiling" || isCompiled}
          >
            {compilationStatus === "compiling" ? "Compiling..." : "Compile"}
          </Button>
          <Button
            variant="default"
            onClick={onRun}
            disabled={!isCompiled || isRunning}
          >
            {isRunning ? "Running..." : "Run"}
          </Button>
        </ButtonGroup>
      </ButtonGroup>
      {runError && (
        <p role="alert" className="max-w-sm rounded-md border border-destructive bg-background p-2 text-xs text-destructive">
          A Connection Error has occurred.
        </p>
      )}
      <CompilationFeedback
        compilationStatus={compilationStatus}
        compilationIssues={compilationIssues}
      />
    </div>
  )
}
