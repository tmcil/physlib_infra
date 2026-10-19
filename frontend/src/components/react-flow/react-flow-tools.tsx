import { useState } from "react"
import { SquarePlus } from "lucide-react"

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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

type BlockGraphItem = {
  block: string
  blockName: string
  type: string
}

type ReactFlowToolsProps = {
  blockGraph: BlockGraphItem[]
  onSelectBlock: (block: string) => void
}

const blockGroups = [
  { type: "input", heading: "Input Blocks" },
  { type: "process", heading: "Process Blocks" },
  { type: "output", heading: "Output Blocks" },
] as const

function BlockCommand({ blockGraph, onSelectBlock }: ReactFlowToolsProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <HoverCard>
        <HoverCardTrigger>
          <Button
            variant="secondary"
            size="default"
            aria-label="Add block"
            onClick={() => setOpen(true)}
          >
            <SquarePlus data-icon="inline-start" color="#0ba800" />
            Add block
          </Button>
        </HoverCardTrigger>
        <HoverCardContent>Add block</HoverCardContent>
      </HoverCard>
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
                        onSelectBlock(block.block)
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
}: ReactFlowToolsProps) {
  return (
    <ButtonGroup aria-label="Canvas actions">
      <BlockCommand blockGraph={blockGraph} onSelectBlock={onSelectBlock} />
    </ButtonGroup>
  )
}
