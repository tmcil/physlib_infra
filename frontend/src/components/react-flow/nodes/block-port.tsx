import { Handle, Position } from "@xyflow/react";
import type { HandleType } from "@xyflow/react";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger
} from "@/components/ui/hover-card";

export type BlockPortDefinition = {
    type: string;
    array: boolean;
    portId: string;
    optional: boolean;
    direction: string;
    helpName: string;
    helpMessage: string;
};


export function BlockPort({ type, array, portId, optional, direction, helpName, helpMessage }: BlockPortDefinition) {
    const portKey: string = direction === "input" ? "relative text-left leading-4" : "relative text-right leading-4";
    const portType: HandleType = direction === "input" ? "target" : "source";
    const portPosition: Position = direction === "input" ? Position.Left : Position.Right;
    const portClassName: string = direction === "input" ? "!left-[-13px] !h-2 !w-2" : "!right-[-13px] !h-2 !w-2";
    const portNoHoverClassName: string = direction === "input" ? "ml-1 text-slate-500" : "mr-1 text-slate-500";
    const portHelpNameClassName: string = direction === "input" ? "ml-1" : "mr-1";

    return (
        <div key={portId} className={portKey}>
            <Handle
                id={portId}
                type={portType}
                position={portPosition}
                className={portClassName}
            />
            {direction === "input" ? (
                <>
                    {helpMessage?.trim() ? (
                        <HoverCard>
                            <HoverCardTrigger>
                                <span className="ml-1 cursor-help text-slate-500">{type}</span>
                            </HoverCardTrigger>
                            <HoverCardContent>
                                <div className="font-semibold">{type}</div>
                                <p>{helpMessage}</p>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    For more information about data products, see *here*
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    ) : (
                        <span className={portNoHoverClassName}>{type}</span>
                    )}
                    {helpName && <span className={portHelpNameClassName}>{helpName}</span>}
                </>
            ) : (
                <>
                    {helpName && <span className={portHelpNameClassName}>{helpName}</span>}
                    {helpMessage?.trim() ? (
                        <HoverCard>
                            <HoverCardTrigger>
                                <span className="mr-1 cursor-help text-slate-500">{type}</span>
                            </HoverCardTrigger>
                            <HoverCardContent>
                                <div className="font-semibold">{type}</div>
                                <p>{helpMessage}</p>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    For more information about data products, see *here*
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    ) : (
                        <span className={portNoHoverClassName}>{type}</span>
                    )}
                </>
            )}
        </div>)
}
