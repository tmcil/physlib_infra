import { Field, FieldLabel } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

export type BlockConfigCheck = {
  name: string
  helpName: string
  helpMessage: string
  value: boolean
  enableIf: string | null
  disableIf: string | null
}

type CheckProps = {
  id: string
  check: BlockConfigCheck
  disabled?: boolean
  onChange: (check: BlockConfigCheck) => void
}

export function Check({ id, check, disabled = false, onChange }: CheckProps) {
  return (
    <HoverCard>
      <HoverCardTrigger>
        <Field orientation="horizontal">
          <Checkbox
            id={`${id}-${check.name}`}
            name={`${id}-${check.name}`}
            checked={check.value}
            disabled={disabled}
            onCheckedChange={(value) => {
              if (typeof value === "boolean") {
                onChange({ ...check, value })
              }
            }}
          />
          <FieldLabel htmlFor={`${id}-${check.name}`}>
            {check.helpName}
          </FieldLabel>
        </Field>
      </HoverCardTrigger>
      <HoverCardContent side="right" className="whitespace-normal break-words">
        {check.helpMessage}
      </HoverCardContent>
    </HoverCard>
  )
}
