import { useState } from "react"

import { Separator } from "@/components/ui/separator"
import { Field, FieldLabel } from "@/components/ui/field"
import { CalendarIcon, Clock2Icon } from "lucide-react"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Calendar } from "@/components/ui/calendar"

export type BlockConfigDateAndTime = {
  name: string;
  helpName: string;
  helpMessage: string;
  value: string;
  disableIf: string | null;
  enableIf: string | null;
};

type DateAndTimeProps = {
  id: string
  dateAndTime: BlockConfigDateAndTime
  disabled?: boolean
  onChange: (dateAndTime: BlockConfigDateAndTime) => void
}

function dateFromUtcValue(value: string): Date | undefined {
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) {
    return undefined
  }

  return new Date(
    timestamp.getUTCFullYear(),
    timestamp.getUTCMonth(),
    timestamp.getUTCDate()
  )
}

function timeFromUtcValue(value: string): string {
  const timestamp = new Date(value)
  return Number.isNaN(timestamp.getTime())
    ? "00:00:00"
    : timestamp.toISOString().slice(11, 19)
}

function dateTimeToUtcValue(date: Date, time: string): string | undefined {
  if (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time)) {
    return undefined
  }

  const [hours, minutes, seconds = 0] = time.split(":").map(Number)
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
      seconds
    )
  ).toISOString()
}

function formatDateTime(date: Date | undefined, time: string): string {
  if (!date) return "Select date and time"

  const formattedDate = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date)
  return `${formattedDate}, ${time} UTC`
}

export function DateAndTime({
  id,
  dateAndTime,
  disabled = false,
  onChange,
}: DateAndTimeProps) {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() =>
    dateFromUtcValue(dateAndTime.value)
  )
  const [selectedTime, setSelectedTime] = useState(() =>
    timeFromUtcValue(dateAndTime.value)
  )

  const handleApply = () => {
    if (!selectedDate) return
    const value = dateTimeToUtcValue(selectedDate, selectedTime)
    if (!value) return

    onChange({
      ...dateAndTime,
      value,
    })
    setOpen(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSelectedDate(dateFromUtcValue(dateAndTime.value))
      setSelectedTime(timeFromUtcValue(dateAndTime.value))
    }
    setOpen(nextOpen)
  }

  return (
    <HoverCard>
      <HoverCardTrigger>
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className="w-56 justify-start"
                disabled={disabled}
              >
                <CalendarIcon />
                {formatDateTime(
                  dateFromUtcValue(dateAndTime.value),
                  timeFromUtcValue(dateAndTime.value)
                )}
              </Button>
            }
          />
          <PopoverContent className="w-auto gap-3 p-0" align="start" sideOffset={4}>
            <div className="p-3 pb-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={disabled}
                className="p-0"
              />
            </div>
            <Separator />
            <div className="p-3 pt-0">
              <Field>
                <FieldLabel htmlFor={`${id}-${dateAndTime.name}-time`}>Time (UTC)</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id={`${id}-${dateAndTime.name}-time`}
                    type="time"
                    step="1"
                    value={selectedTime}
                    disabled={disabled}
                    onChange={(event) => setSelectedTime(event.currentTarget.value)}
                  />
                  <InputGroupAddon>
                    <Clock2Icon className="text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </div>
            <div className="flex justify-end p-3 pt-0">
              <Button
                onClick={handleApply}
                disabled={
                  disabled ||
                  !selectedDate ||
                  !dateTimeToUtcValue(selectedDate, selectedTime)
                }
              >
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </HoverCardTrigger>
      <HoverCardContent side="right" className="whitespace-normal break-words">
        {dateAndTime.helpMessage}
      </HoverCardContent>
    </HoverCard>
  )
}
