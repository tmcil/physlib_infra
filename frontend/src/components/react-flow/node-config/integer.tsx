import { useState } from "react"
import { MinusIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription } from "@/components/ui/field"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"

export type BlockConfigInteger = {
  name: string
  helpName: string
  helpMessage: string
  value: number
  units: string
  minimumValue: number
  maximumValue: number
  enableIf: string | null
  disableIf: string | null
}

type IntegerProps = {
  id: string
  integer: BlockConfigInteger
  disabled?: boolean
  onChange: (integer: BlockConfigInteger) => void
}

export function Integer({ id, integer, disabled = false, onChange }: IntegerProps) {
  const [draftValue, setDraftValue] = useState<string | null>(null)
  const numericDraft = draftValue === null ? integer.value : Number(draftValue)
  const validationMessage =
    draftValue !== null && Number.isFinite(numericDraft)
      ? numericDraft < integer.minimumValue
        ? `Minimum value is ${integer.minimumValue}`
        : numericDraft > integer.maximumValue
          ? `Maximum value is ${integer.maximumValue}`
          : undefined
      : undefined
  const isInvalid =
    draftValue !== null &&
    (draftValue.trim() === "" ||
      !Number.isInteger(numericDraft) ||
      numericDraft < integer.minimumValue ||
      numericDraft > integer.maximumValue)

  function updateValue(value: number) {
    if (
      Number.isInteger(value) &&
      value >= integer.minimumValue &&
      value <= integer.maximumValue
    ) {
      onChange({ ...integer, value })
    }
  }

  return (
    <HoverCard>
      <HoverCardTrigger>
        <Field
          data-invalid={isInvalid ? "true" : undefined}
          data-disabled={disabled ? "true" : undefined}
        >
          <InputGroup>
            <InputGroupInput
              id={`${id}-${integer.name}`}
              type="number"
              min={integer.minimumValue}
              max={integer.maximumValue}
              step={1}
              value={draftValue ?? String(integer.value)}
              aria-invalid={isInvalid}
              disabled={disabled}
              className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              onChange={(event) => {
                const inputValue = event.currentTarget.value
                const value = event.currentTarget.valueAsNumber
                setDraftValue(inputValue)

                if (
                  Number.isInteger(value) &&
                  value >= integer.minimumValue &&
                  value <= integer.maximumValue
                ) {
                  updateValue(value)
                }
              }}
              onBlur={() => setDraftValue(null)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>{integer.units}</InputGroupText>
              <div className="flex flex-col">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  className="h-4 w-6 rounded-b-none"
                  aria-label={`Increase ${integer.helpName}`}
                  disabled={disabled || integer.value >= integer.maximumValue}
                  onClick={() => updateValue(integer.value + 1)}
                >
                  <PlusIcon />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  className="h-4 w-6 rounded-t-none"
                  aria-label={`Decrease ${integer.helpName}`}
                  disabled={disabled || integer.value <= integer.minimumValue}
                  onClick={() => updateValue(integer.value - 1)}
                >
                  <MinusIcon />
                </Button>
              </div>
            </InputGroupAddon>
          </InputGroup>
          {validationMessage && (
            <FieldDescription className="text-destructive">
              {validationMessage}
            </FieldDescription>
          )}
        </Field>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        className="whitespace-normal break-words"
      >
        {integer.helpMessage}
      </HoverCardContent>
    </HoverCard>
  )
}
