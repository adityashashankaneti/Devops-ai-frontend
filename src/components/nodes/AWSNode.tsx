import { Handle, Position, NodeProps } from 'reactflow';
import { AWSResource } from '../../types';

export default function AWSNode({ data, selected }: NodeProps<AWSResource>) {
  return (
    <div
      className={`relative min-w-[90px] rounded-xl border transition-all duration-150 select-none ${
        selected
          ? 'border-indigo-400/80 shadow-lg shadow-indigo-500/20 bg-slate-700'
          : 'border-slate-600/80 hover:border-slate-400/60 bg-slate-800'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-indigo-500 !border-indigo-300 !border !-top-1"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-indigo-500 !border-indigo-300 !border !-left-1"
      />

      <div className="flex flex-col items-center gap-1.5 p-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md"
          style={{ backgroundColor: data.color }}
        >
          {data.abbr}
        </div>
        <span className="text-slate-200 text-[10px] font-medium text-center leading-tight max-w-[80px]">
          {data.name}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-indigo-500 !border-indigo-300 !border !-bottom-1"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-indigo-500 !border-indigo-300 !border !-right-1"
      />
    </div>
  );
}
