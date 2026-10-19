import { useState } from "react"
import { SquarePlus } from "lucide-react"
import { useReactFlow, type XYPosition } from "@xyflow/react"
import type { RefObject } from "react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
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
  canvasRef: RefObject<HTMLDivElement | null>
}

const blockGroups = [
  { type: "input", heading: "Input Blocks" },
  { type: "process", heading: "Process Blocks" },
  { type: "output", heading: "Output Blocks" },
] as const

function BlockCommand({
  blockGraph,
  onSelectBlock,
  canvasRef,
}: ReactFlowToolsProps) {
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

export default function ReactFlowTools({
  blockGraph,
  onSelectBlock,
  canvasRef,
}: ReactFlowToolsProps) {
  return (
    <ButtonGroup aria-label="Canvas actions">
      <BlockCommand
        blockGraph={blockGraph}
        onSelectBlock={onSelectBlock}
        canvasRef={canvasRef}
      />
    </ButtonGroup>
  )
}
