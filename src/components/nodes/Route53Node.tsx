import { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { AWSResource } from '../../types';

const DNS_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'SRV', 'PTR', 'CAA'];

interface DnsRecord {
  id: string;
  name: string;
  type: string;
  value: string;
  ttl: string;
}

const defaultRecord = (): DnsRecord => ({
  id: Math.random().toString(36).slice(2),
  name: '',
  type: 'A',
  value: '',
  ttl: '300',
});

export default function Route53Node({ data, selected }: NodeProps<AWSResource>) {
  const [expanded, setExpanded] = useState(false);
  const [hostedZone, setHostedZone] = useState('example.com');
  const [records, setRecords] = useState<DnsRecord[]>([
    { id: '1', name: '@', type: 'A', value: '0.0.0.0', ttl: '300' },
    { id: '2', name: 'www', type: 'CNAME', value: '', ttl: '300' },
  ]);

  const addRecord = () => setRecords((r) => [...r, defaultRecord()]);

  const update = (id: string, field: keyof DnsRecord, val: string) =>
    setRecords((r) => r.map((rec) => (rec.id === id ? { ...rec, [field]: val } : rec)));

  const remove = (id: string) => setRecords((r) => r.filter((rec) => rec.id !== id));

  return (
    <div
      className={`rounded-xl border transition-all duration-150 ${
        selected
          ? 'border-indigo-400/80 shadow-lg shadow-indigo-500/20 bg-slate-700'
          : 'border-slate-600/80 hover:border-slate-400/60 bg-slate-800'
      }`}
    >
      <Handle type="source" position={Position.Top}    id="top"    className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-indigo-200 !opacity-100 !rounded-full" />
      <Handle type="source" position={Position.Left}   id="left"   className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-indigo-200 !opacity-100 !rounded-full" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-indigo-200 !opacity-100 !rounded-full" />
      <Handle type="source" position={Position.Right}  id="right"  className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-indigo-200 !opacity-100 !rounded-full" />

      {/* Header — clickable to toggle, draggable */}
      <div
        className="flex flex-col items-center gap-1 p-2 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-md"
          style={{ backgroundColor: data.color }}
        >
          {data.abbr}
        </div>
        <span className="text-slate-200 text-[10px] font-medium">{data.name}</span>

        {/* Hosted zone name — inline editable, nodrag so it doesn't trigger drag/toggle */}
        <div
          className="nodrag"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <input
            value={hostedZone}
            onChange={(e) => setHostedZone(e.target.value)}
            placeholder="example.com"
            className="bg-slate-700/60 border border-slate-600/60 rounded-md px-1.5 py-0.5 text-[10px] text-indigo-300 font-mono text-center outline-none focus:border-indigo-500/60 w-28 transition-colors placeholder:text-slate-500"
          />
        </div>

        <ChevronDown
          size={11}
          className={`text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* DNS Records table — nodrag prevents canvas drag when interacting */}
      {expanded && (
        <div
          className="nodrag border-t border-slate-700/60 bg-slate-900/80 rounded-b-xl"
          style={{ width: 300 }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              DNS Records
            </span>
            <button
              onClick={addRecord}
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-[10px] font-medium transition-colors"
            >
              <Plus size={10} />
              Add Record
            </button>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1fr_56px_1fr_44px_22px] gap-1 px-2 py-1 border-b border-slate-700/40">
            {['Name', 'Type', 'Value', 'TTL', ''].map((h) => (
              <span key={h} className="text-[9px] text-slate-600 uppercase tracking-wider font-semibold">
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div className="max-h-48 overflow-y-auto">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="grid grid-cols-[1fr_56px_1fr_44px_22px] gap-1 px-2 py-0.5 items-center hover:bg-slate-800/40 group"
              >
                <input
                  value={rec.name}
                  onChange={(e) => update(rec.id, 'name', e.target.value)}
                  placeholder="@"
                  className="bg-slate-800/60 border border-slate-700/60 rounded px-1.5 py-0.5 text-[10px] text-slate-200 outline-none focus:border-indigo-500/60 w-full"
                />
                <select
                  value={rec.type}
                  onChange={(e) => update(rec.id, 'type', e.target.value)}
                  className="bg-slate-800/60 border border-slate-700/60 rounded px-1 py-0.5 text-[10px] text-slate-200 outline-none focus:border-indigo-500/60 w-full"
                >
                  {DNS_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  value={rec.value}
                  onChange={(e) => update(rec.id, 'value', e.target.value)}
                  placeholder="1.2.3.4"
                  className="bg-slate-800/60 border border-slate-700/60 rounded px-1.5 py-0.5 text-[10px] text-slate-200 outline-none focus:border-indigo-500/60 w-full"
                />
                <input
                  value={rec.ttl}
                  onChange={(e) => update(rec.id, 'ttl', e.target.value)}
                  placeholder="300"
                  className="bg-slate-800/60 border border-slate-700/60 rounded px-1.5 py-0.5 text-[10px] text-slate-200 outline-none focus:border-indigo-500/60 w-full"
                />
                <button
                  onClick={() => remove(rec.id)}
                  className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>

          {records.length === 0 && (
            <p className="text-center text-slate-600 text-[10px] py-3">
              No records · click Add Record
            </p>
          )}

          <div className="h-2" />
        </div>
      )}

      {/* bottom/right already declared above with IDs */}
    </div>
  );
}
