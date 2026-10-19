import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

export type BlockConfigComboOption = {
  name: string
  value: number
  helpMessage: string
}

export type BlockConfigCombo = {
  name: string
  helpName: string
  helpMessage: string
  value: number
  options: BlockConfigComboOption[]
  enableIf: string | null
  disableIf: string | null
}

type ComboProps = {
  id: string
  combo: BlockConfigCombo
  disabled?: boolean
  onChange: (combo: BlockConfigCombo) => void
}

export function Combo({ id, combo, disabled = false, onChange }: ComboProps) {
  return (
    <HoverCard>
      <HoverCardTrigger>
        <Combobox<number>
          value={combo.value}
          disabled={disabled}
          itemToStringLabel={(value) =>
            combo.options.find((option) => option.value === value)?.name ?? ""
          }
          onValueChange={(value) => {
            if (typeof value === "number" && Number.isInteger(value)) {
              onChange({ ...combo, value })
            }
          }}
        >
          <ComboboxInput
            id={`${id}-${combo.name}`}
            className="w-full"
            readOnly
            disabled={disabled}
            aria-label={combo.helpName}
          />
          <ComboboxContent>
            <ComboboxList>
              {combo.options.map((option) => (
                <HoverCard key={option.value}>
                  <ComboboxItem
                    value={option.value}
                    render={<HoverCardTrigger />}
                  >
                    {option.name}
                  </ComboboxItem>
                  <HoverCardContent
                    side="right"
                    className="whitespace-normal break-words"
                  >
                    {option.helpMessage}
                  </HoverCardContent>
                </HoverCard>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </HoverCardTrigger>
      <HoverCardContent side="right" className="whitespace-normal break-words">
        {combo.helpMessage}
      </HoverCardContent>
    </HoverCard>
  )
}
