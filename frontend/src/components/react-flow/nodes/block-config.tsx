import React from "react"
import { Settings2 } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"

export type BlockConfigCalendarInterval = {
    name: string;
    helpName: string;
    helpMessage: string;
    value: {
        start: string;
        end: string;
    };
    minimumValueDays: number;
    maximumValueDays: number;
};

export type BlockConfigCheck = {
    name: string;
    helpName: string;
    helpMessage: string;
    value: boolean;
};

export type BlockConfigCombo = {
    name: string;
    helpName: string;
    helpMessage: string;
    value: string;
};

export type BlockConfigFloat = {
    name: string;
    helpName: string;
    helpMessage: string;
    value: number;
    units: string;
    minimumValue: number;
    maximumValue: number;
};

export type BlockConfigDefinition = {
    calendarInterval: BlockConfigCalendarInterval[];
    check: BlockConfigCheck[];
    combo: BlockConfigCombo[];
    float: BlockConfigFloat[];
};

"use client"

import { Clock2Icon } from "lucide-react"

type CalendarWithTimeProps = {
    value: string;
    onChange: (value: string) => void;
};


export function CalendarWithTime({ value, onChange }: CalendarWithTimeProps) {
    const selectedDate = value ? new Date(value) : undefined;

    return (
        <Card size="sm" className="mx-auto w-fit">
            <CardContent>
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                        if (date) {
                            onChange(date.toISOString());
                        }
                    }}
                    className="p-0"
                />
            </CardContent>
            <CardFooter className="border-t bg-card">
                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="time-from">Time (UTC)</FieldLabel>
                        <InputGroup>
                            <InputGroupInput
                                id="time-from"
                                type="time"
                                step="1"
                                defaultValue="10:30:00"
                                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                            />
                            <InputGroupAddon>
                                <Clock2Icon className="text-muted-foreground" />
                            </InputGroupAddon>
                        </InputGroup>
                    </Field>
                </FieldGroup>
            </CardFooter>
        </Card>
    )
}


export function BlockConfig({ data, block_name, id }: { data: BlockConfigDefinition, block_name: string, id: string }) {
    let calendars = data.calendarInterval
    let checks = data.check
    let combos = data.combo
    let floats = data.float

    return (
        <div>
            <Popover>
                <PopoverTrigger render={<Button variant="ghost" size="icon-sm"><Settings2 strokeWidth={2}></Settings2></Button>}></PopoverTrigger>
                <PopoverContent>
                    <PopoverHeader>
                        <PopoverTitle>{block_name} Configuration</PopoverTitle>
                        <PopoverDescription>{id.split("-")[0]}</PopoverDescription>
                    </PopoverHeader>
                    <Separator />
                    <ScrollArea className="h-150 w-full rounded-sm border p-4">
                        <div>
                            <FieldGroup>
                                <Field>
                                <FieldLabel htmlFor="calendarInterval">Start Time</FieldLabel>
                                <CalendarWithTime 
                                    value={calendars[0].value.start} 
                                    onChange={(value) => {
                                        calendars[0].value.start = value;
                                        console.log("calendars[0].value.start:", calendars[0].value.start);
                                        }}
                                    />
                                </Field>
                            </FieldGroup>
                        </div>
                        <ScrollBar />
                    </ScrollArea>
                </PopoverContent>
            </Popover>
        </div>
    )
}