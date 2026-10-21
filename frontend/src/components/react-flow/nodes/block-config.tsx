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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

import { Settings2 } from "lucide-react"

import { type BlockConfigCheck, Check } from "../node-config/check"
import { type BlockConfigDateAndTime, DateAndTime } from "../node-config/date-and-time"
import { type BlockConfigFloat, Float } from "../node-config/float"
import { type BlockConfigInteger, Integer } from "../node-config/integer"
import { type BlockConfigString, StringInput } from "../node-config/string"
import { type BlockConfigCombo, Combo } from "../node-config/combo"

export type BlockConfigDefinition = {
    dateandtime: BlockConfigDateAndTime[];
    check: BlockConfigCheck[];
    combo: BlockConfigCombo[];
    integer: BlockConfigInteger[];
    float: BlockConfigFloat[];
    string: BlockConfigString[];
};


type BlockConfigProps = {
    data: BlockConfigDefinition;
    block_name: string;
    id: string;
    onChange: (config: BlockConfigDefinition) => void;
};

export function BlockConfig({ data, block_name, id, onChange }: BlockConfigProps) {
    for (const check of data.check) {
        if (check.enableIf === check.name || check.disableIf === check.name) {
            throw new Error(
                `Check "${check.name}" cannot reference itself in enableIf or disableIf`
            )
        }
    }

    function isEnabled(item: { enableIf: string | null; disableIf: string | null }) {
        const enabledByCheck =
            item.enableIf === null ||
            data.check.some(
                (check) => check.name === item.enableIf && check.value
            )
        const notDisabledByCheck =
            item.disableIf === null ||
            !data.check.some(
                (check) => check.name === item.disableIf && check.value
            )

        return enabledByCheck && notDisabledByCheck
    }

    function handleDateAndTimeChange(
        name: string,
        dateAndTime: BlockConfigDateAndTime
    ) {
        const nextConfig = {
            ...data,
            dateandtime: data.dateandtime.map((currentTime) =>
                currentTime.name === name ? dateAndTime : currentTime
            ),
        };
        onChange(nextConfig);
    }
    
    function handleFloatChange(
        name: string,
        float: BlockConfigFloat
    ) {
        const nextConfig = {
            ...data,
            float: data.float.map((currentFloat) =>
                currentFloat.name === name ? float : currentFloat
            ),
        };
        onChange(nextConfig);
    }

    function handleIntegerChange(
        name: string,
        integer: BlockConfigInteger
    ) {
        const nextConfig = {
            ...data,
            integer: data.integer.map((currentInteger) =>
                currentInteger.name === name ? integer : currentInteger
            ),
        };
        onChange(nextConfig);
    }

    function handleCheckChange(name: string, check: BlockConfigCheck) {
        const nextConfig = {
            ...data,
            check: data.check.map((currentCheck) =>
                currentCheck.name === name ? check : currentCheck
            ),
        };
        onChange(nextConfig);
    }

    function handleStringChange(name: string, string: BlockConfigString) {
        const nextConfig = {
            ...data,
            string: data.string.map((currentString) =>
                currentString.name === name ? string : currentString
            ),
        };
        onChange(nextConfig);
    }

    function handleComboChange(name: string, combo: BlockConfigCombo) {
        const nextConfig = {
            ...data,
            combo: data.combo.map((currentCombo) =>
                currentCombo.name === name ? combo : currentCombo
            ),
        };
        onChange(nextConfig);
    }

    return (
        <div>
            <Popover>
                <PopoverTrigger render={<Button variant="ghost" size="icon-sm"><Settings2 strokeWidth={2}></Settings2></Button>}></PopoverTrigger>
                <PopoverContent>
                    <PopoverHeader>
                        <PopoverTitle>{block_name} Configuration</PopoverTitle>
                        <PopoverDescription>{id.split("-").at(-1)}</PopoverDescription>
                    </PopoverHeader>
                    <Separator />
                    <ScrollArea className="h-150 w-full rounded-sm border p-4">
                        <div>
                            <FieldGroup>
                                {data.check.map((check) => (
                                    <Check
                                        key={check.name}
                                        id={id}
                                        check={check}
                                        disabled={!isEnabled(check)}
                                        onChange={(updatedCheck) =>
                                            handleCheckChange(check.name, updatedCheck)
                                        }
                                    />
                                ))}
                                {data.combo.map((combo) => (
                                    <Field
                                        key={combo.name}
                                        data-disabled={!isEnabled(combo) ? "true" : undefined}
                                    >
                                        <FieldLabel htmlFor={`${id}-${combo.name}`}>
                                            {combo.helpName}
                                        </FieldLabel>
                                        <Combo
                                            id={id}
                                            combo={combo}
                                            disabled={!isEnabled(combo)}
                                            onChange={(updatedCombo) =>
                                                handleComboChange(combo.name, updatedCombo)
                                            }
                                        />
                                    </Field>
                                ))}
                                {data.string.map((string) => (
                                    <Field
                                        key={string.name}
                                        data-disabled={!isEnabled(string) ? "true" : undefined}
                                    >
                                        <FieldLabel htmlFor={`${id}-${string.name}`}>
                                            {string.helpName}
                                        </FieldLabel>
                                        <StringInput
                                            id={id}
                                            string={string}
                                            disabled={!isEnabled(string)}
                                            onChange={(updatedString) =>
                                                handleStringChange(string.name, updatedString)
                                            }
                                        />
                                    </Field>
                                ))}
                                {data.dateandtime.map((dateAndTime) => (
                                    <Field
                                        key={dateAndTime.name}
                                        data-disabled={!isEnabled(dateAndTime) ? "true" : undefined}
                                    >
                                        <FieldLabel htmlFor={`${id}-${dateAndTime.name}`}>
                                            {dateAndTime.helpName}
                                        </FieldLabel>
                                        <DateAndTime
                                            id={id}
                                            dateAndTime={dateAndTime}
                                            disabled={!isEnabled(dateAndTime)}
                                            onChange={(updatedDateAndTime) =>
                                                handleDateAndTimeChange(
                                                    dateAndTime.name,
                                                    updatedDateAndTime
                                                )
                                            }
                                        />
                                    </Field>
                                ))}
                                {data.integer.map((integer) => (
                                    <Field
                                        key={integer.name}
                                        data-disabled={!isEnabled(integer) ? "true" : undefined}
                                    >
                                        <FieldLabel htmlFor={`${id}-${integer.name}`}>
                                            {integer.helpName}
                                        </FieldLabel>
                                        <Integer
                                            id={id}
                                            integer={integer}
                                            disabled={!isEnabled(integer)}
                                            onChange={(updatedInteger) =>
                                                handleIntegerChange(
                                                    integer.name,
                                                    updatedInteger
                                                )
                                            }
                                        />
                                    </Field>
                                ))}
                                {data.float.map((float) => (
                                    <Field
                                        key={float.name}
                                        data-disabled={!isEnabled(float) ? "true" : undefined}
                                    >
                                        <FieldLabel htmlFor={`${id}-${float.name}`}>
                                            {float.helpName}
                                        </FieldLabel>
                                        <Float
                                            id={id}
                                            float={float}
                                            disabled={!isEnabled(float)}
                                            onChange={(updatedFloat) =>
                                                handleFloatChange(
                                                    float.name,
                                                    updatedFloat
                                                )
                                            }
                                        />
                                    </Field>
                                ))}
                            </FieldGroup>
                        </div>
                        <ScrollBar />
                    </ScrollArea>
                </PopoverContent>
            </Popover>
        </div>
    )
}