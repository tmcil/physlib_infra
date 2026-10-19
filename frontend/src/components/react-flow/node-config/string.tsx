import { useState } from "react"

import { Field, FieldDescription } from "@/components/ui/field"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"

export type BlockConfigString = {
  name: string
  helpName: string
  helpMessage: string
  value: string
  minimumLength: number
  maximumLength: number
  enableIf: string | null
  disableIf: string | null
}

type StringProps = {
  id: string
  string: BlockConfigString
  disabled?: boolean
  onChange: (string: BlockConfigString) => void
}

export function StringInput({
  id,
  string,
  disabled = false,
  onChange,
}: StringProps) {
  const [draftValue, setDraftValue] = useState<string | null>(null)
  const currentValue = draftValue ?? string.value
  const validationMessage =
    draftValue !== null
      ? draftValue.length < string.minimumLength
        ? `Minimum length is ${string.minimumLength}`
        : draftValue.length > string.maximumLength
          ? `Maximum length is ${string.maximumLength}`
          : undefined
      : undefined
  const isInvalid = validationMessage !== undefined

  return (
    <HoverCard>
      <HoverCardTrigger>
        <Field
          data-invalid={isInvalid ? "true" : undefined}
          data-disabled={disabled ? "true" : undefined}
        >
          <InputGroup>
            <InputGroupInput
              id={`${id}-${string.name}`}
              type="text"
              value={currentValue}
              aria-invalid={isInvalid}
              disabled={disabled}
              onChange={(event) => {
                const value = event.currentTarget.value
                setDraftValue(value)

                if (
                  value.length >= string.minimumLength &&
                  value.length <= string.maximumLength
                ) {
                  onChange({ ...string, value })
                }
              }}
              onBlur={() => setDraftValue(null)}
            />
          </InputGroup>
          {validationMessage && (
            <FieldDescription className="text-destructive">
              {validationMessage}
            </FieldDescription>
          )}
        </Field>
      </HoverCardTrigger>
      <HoverCardContent side="right" className="whitespace-normal break-words">
        {string.helpMessage}
      </HoverCardContent>
    </HoverCard>
  )
}
