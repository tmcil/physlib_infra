import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { BlockPort } from "./block-port";
import type { BlockPortDefinition } from "./block-port";
import { BlockConfig, type BlockConfigDefinition } from "./block-config";

export type BlockDefinition = {
  block: string;
  ports: BlockPortDefinition[];
  blockName: string;
  type: string;
  config: BlockConfigDefinition;
};

export type BlockFlowNode = Node<BlockDefinition, "block">;

export function BlockNode({ id, data }: NodeProps<BlockFlowNode>) {
  const { updateNodeData } = useReactFlow<BlockFlowNode>();
  const inputs = data.ports.filter((port) => port.direction === "input");
  const outputs = data.ports.filter((port) => port.direction === "output");
  const title = data.block.startsWith("BLOCK_")
    ? data.block.slice("BLOCK_".length)
    : data.block;

  function handleConfigChange(config: BlockConfigDefinition) {
    updateNodeData(id, { config });
  }

  return (
    <div className="relative min-w-50 rounded-sm border border-slate-400 bg-white px-3 py-2 text-slate-900 shadow-sm">
      <span className="absolute left-1 top-0.5 max-w-[90%] truncate text-[9px] leading-none text-slate-500">
        {id.split("-")[0]}
      </span>
      <span className="absolute right-0 top-0 max-w-[90%] truncate text-[9px] leading-none text-slate-500">
        <BlockConfig
          data={data.config}
          block_name={data.blockName}
          id={id}
          onChange={handleConfigChange}
        />
      </span>
      <div className="mb-2 text-center text-sm font-semibold">{title}</div>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-2 pr-1">
          {inputs.map((port) => {
            return BlockPort({ ...port });
          })}
        </div>
        <div className="space-y-2 pl-1">
          {outputs.map((port) => {
            return BlockPort({ ...port });
          })}
        </div>
      </div>
    </div>
  );
}
