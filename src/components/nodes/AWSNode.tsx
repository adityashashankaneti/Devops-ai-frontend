import { Handle, Position, NodeProps } from 'reactflow';
import { AWSResource } from '../../types';

const H = '!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-indigo-200 !opacity-100 !rounded-full';

export default function AWSNode({ data, selected }: NodeProps<AWSResource>) {
  return (
    <div
      className={`relative min-w-[90px] rounded-xl border transition-all duration-150 select-none ${
        selected
          ? 'border-indigo-400/80 shadow-lg shadow-indigo-500/20 bg-slate-700'
          : 'border-slate-600/80 hover:border-slate-400/60 bg-slate-800'
      }`}
    >
      <Handle type="source" position={Position.Top}    id="top"    className={H} />
      <Handle type="source" position={Position.Left}   id="left"   className={H} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={H} />
      <Handle type="source" position={Position.Right}  id="right"  className={H} />

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
    </div>
  );
}
