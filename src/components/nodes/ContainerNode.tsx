import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { Lock } from 'lucide-react';
import { AWSResource } from '../../types';
import { useIsNodeDeployed } from '../../contexts/DeployedNodesContext';

interface NodeData extends AWSResource {
  config?: Record<string, string | boolean | number>;
}

export default function ContainerNode({ id, data, selected }: NodeProps<NodeData>) {
  const isDeployed = useIsNodeDeployed(id);
  const cidr  = data.config?.cidrBlock as string | undefined;
  const label = data.config?.name as string | undefined;

  const borderColor = isDeployed ? '#10b981' : data.color;
  const borderStyle = isDeployed ? `2px solid ${borderColor}55` : `2px dashed ${borderColor}55`;
  const bgColor     = isDeployed ? '#10b98110' : data.color + '10';

  return (
    <div className="w-full h-full" style={{ overflow: 'visible' }}>
      <NodeResizer
        isVisible={selected}
        minWidth={240}
        minHeight={160}
        handleStyle={{ width: 8, height: 8, borderRadius: 2, background: borderColor, border: 'none' }}
        lineStyle={{ borderColor: borderColor + '80' }}
      />

      {/* CIDR label — floats above the top border */}
      {cidr && (
        <div
          className="absolute pointer-events-none select-none font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md"
          style={{
            top: -22,
            left: 8,
            backgroundColor: borderColor + '20',
            border: `1px solid ${borderColor}50`,
            color: borderColor,
            whiteSpace: 'nowrap',
          }}
        >
          {cidr}
        </div>
      )}

      {/* Container body */}
      <div
        className="w-full h-full rounded-2xl relative"
        style={{ backgroundColor: bgColor, border: borderStyle }}
      >
        {/* Deployed glow overlay */}
        {isDeployed && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: 'inset 0 0 20px rgba(16,185,129,0.06)' }} />
        )}

        {/* Top-left badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2 select-none">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold shadow"
            style={{ backgroundColor: borderColor }}
          >
            {data.abbr}
          </div>
          <span className="pointer-events-none text-[11px] font-semibold" style={{ color: borderColor }}>
            {label || data.name}
          </span>
          {isDeployed && (
            <span className="flex items-center gap-0.5 text-[9px] text-emerald-400 font-semibold">
              <Lock size={8} />
              live
            </span>
          )}
        </div>

        {/* Handles */}
        <Handle type="source" position={Position.Top}    id="top"    className="!w-3.5 !h-3.5 !border-2 !border-slate-300 !opacity-100 !rounded-full" style={{ background: borderColor }} />
        <Handle type="source" position={Position.Left}   id="left"   className="!w-3.5 !h-3.5 !border-2 !border-slate-300 !opacity-100 !rounded-full" style={{ background: borderColor }} />
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3.5 !h-3.5 !border-2 !border-slate-300 !opacity-100 !rounded-full" style={{ background: borderColor }} />
        <Handle type="source" position={Position.Right}  id="right"  className="!w-3.5 !h-3.5 !border-2 !border-slate-300 !opacity-100 !rounded-full" style={{ background: borderColor }} />
      </div>
    </div>
  );
}
