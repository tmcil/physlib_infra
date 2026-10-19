import { useState } from "react"

import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger
} from "@/components/ui/hover-card";
import { Field, FieldDescription } from "@/components/ui/field"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group"

export type BlockConfigFloat = {
    name: string;
    helpName: string;
    helpMessage: string;
    value: number;
    units: string;
    minimumValue: number;
    maximumValue: number;
    enableIf: string | null;
    disableIf: string | null;
};

type FloatProps = {
    id: string
    float: BlockConfigFloat
    disabled?: boolean
    onChange: (float: BlockConfigFloat) => void
}

export function Float({ id, float, disabled = false, onChange }: FloatProps) {
    const [draftValue, setDraftValue] = useState<string | null>(null)
    const numericDraft = draftValue === null ? float.value : Number(draftValue)
    const validationMessage =
        draftValue !== null && Number.isFinite(numericDraft)
            ? numericDraft < float.minimumValue
                ? `Minimum value is ${float.minimumValue}`
                : numericDraft > float.maximumValue
                  ? `Maximum value is ${float.maximumValue}`
                  : undefined
            : undefined
    const isInvalid =
        draftValue !== null &&
        (draftValue.trim() === "" ||
            !Number.isFinite(numericDraft) ||
            numericDraft < float.minimumValue ||
            numericDraft > float.maximumValue)

    return (
    <HoverCard>
        <HoverCardTrigger>
        <Field
            data-invalid={isInvalid ? "true" : undefined}
            data-disabled={disabled ? "true" : undefined}
        >
            <InputGroup>
                <InputGroupInput
                    id={`${id}-${float.name}`}
                    type="number"
                    min={float.minimumValue}
                    max={float.maximumValue}
                    value={draftValue ?? String(float.value)}
                    aria-invalid={isInvalid}
                    disabled={disabled}
                    className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    onChange={(event) => {
                        const inputValue = event.currentTarget.value
                        const value = event.currentTarget.valueAsNumber
                        setDraftValue(inputValue)

                        if (
                            Number.isFinite(value) &&
                            value >= float.minimumValue &&
                            value <= float.maximumValue
                        ) {
                            onChange({ ...float, value })
                        }
                    }}
                    onBlur={() => setDraftValue(null)}
                />
                <InputGroupAddon align="inline-end">
                    <InputGroupText>{float.units}</InputGroupText>
                </InputGroupAddon>
            </InputGroup>
            {validationMessage && (
                <FieldDescription className="text-destructive">
                    {validationMessage}
                </FieldDescription>
            )}
        </Field>
        </HoverCardTrigger>
        <HoverCardContent side="right" className="whitespace-normal break-words">
        {float.helpMessage}
        </HoverCardContent>
    </HoverCard>
    )
}