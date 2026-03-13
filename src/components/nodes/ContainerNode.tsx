import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { AWSResource } from '../../types';

interface NodeData extends AWSResource {
  config?: Record<string, string | boolean | number>;
}

export default function ContainerNode({ data, selected }: NodeProps<NodeData>) {
  const cidr = data.config?.cidrBlock as string | undefined;
  const label = data.config?.name as string | undefined;

  return (
    // overflow-visible so the floating CIDR label can render above the border
    <div className="w-full h-full" style={{ overflow: 'visible' }}>
      <NodeResizer
        isVisible={selected}
        minWidth={240}
        minHeight={160}
        handleStyle={{ width: 8, height: 8, borderRadius: 2, background: data.color, border: 'none' }}
        lineStyle={{ borderColor: data.color + '80' }}
      />

      {/* CIDR label — floats above the top border */}
      {cidr && (
        <div
          className="absolute pointer-events-none select-none font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md"
          style={{
            top: -22,
            left: 8,
            backgroundColor: data.color + '20',
            border: `1px solid ${data.color}50`,
            color: data.color,
            whiteSpace: 'nowrap',
          }}
        >
          {cidr}
        </div>
      )}

      {/* Container body */}
      <div
        className="w-full h-full rounded-2xl relative"
        style={{
          backgroundColor: data.color + '10',
          border: `2px dashed ${data.color}55`,
        }}
      >
        {/* Top-left badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2 select-none">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold shadow"
            style={{ backgroundColor: data.color }}
          >
            {data.abbr}
          </div>
          <span className="pointer-events-none text-[11px] font-semibold" style={{ color: data.color }}>
            {label || data.name}
          </span>
        </div>

        {/* Handles */}
        <Handle type="source" position={Position.Top}    id="top"    className="!w-3.5 !h-3.5 !border-2 !border-slate-300 !opacity-100 !rounded-full" style={{ background: data.color }} />
        <Handle type="source" position={Position.Left}   id="left"   className="!w-3.5 !h-3.5 !border-2 !border-slate-300 !opacity-100 !rounded-full" style={{ background: data.color }} />
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3.5 !h-3.5 !border-2 !border-slate-300 !opacity-100 !rounded-full" style={{ background: data.color }} />
        <Handle type="source" position={Position.Right}  id="right"  className="!w-3.5 !h-3.5 !border-2 !border-slate-300 !opacity-100 !rounded-full" style={{ background: data.color }} />
      </div>
    </div>
  );
}
