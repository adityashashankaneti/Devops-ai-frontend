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
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none select-none">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold shadow"
            style={{ backgroundColor: data.color }}
          >
            {data.abbr}
          </div>
          <span className="text-[11px] font-semibold" style={{ color: data.color }}>
            {label || data.name}
          </span>
        </div>

        {/* Handles */}
        <Handle
          type="target"
          position={Position.Top}
          className="!w-2.5 !h-2.5 !border-2 !border-slate-600"
          style={{ background: data.color }}
        />
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2.5 !h-2.5 !border-2 !border-slate-600"
          style={{ background: data.color }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-2.5 !h-2.5 !border-2 !border-slate-600"
          style={{ background: data.color }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="!w-2.5 !h-2.5 !border-2 !border-slate-600"
          style={{ background: data.color }}
        />
      </div>
    </div>
  );
}
