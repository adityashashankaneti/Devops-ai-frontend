import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Trash2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Node } from 'reactflow';
import { AWSResource, DeployedNodeInfo } from '../types';
import { getFieldsForResource, FieldDef } from '../data/resourceFields';

const DESTROY_URL      = import.meta.env.VITE_DESTROY_URL      ?? 'http://localhost:8000/api/destroy';
const COMMIT_STATUS_URL = import.meta.env.VITE_COMMIT_STATUS_URL ?? 'http://localhost:8000/api/commit-status';

interface Props {
  node: Node<AWSResource> | null;
  onClose: () => void;
  onUpdate: (nodeId: string, config: Record<string, string | boolean | number>) => void;
  deployedNodeInfo?: DeployedNodeInfo;
  onNodeDestroyed?: (nodeId: string) => void;
}

function ToggleField({
  fieldDef, value, onChange,
}: { fieldDef: FieldDef; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0">
      <span className="text-slate-300 text-xs">{fieldDef.label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-indigo-600' : 'bg-slate-700'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function InputField({
  fieldDef, value, onChange,
}: { fieldDef: FieldDef; value: string; onChange: (v: string) => void }) {
  const base = 'w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500/60 transition-colors placeholder:text-slate-600';
  return (
    <div className="mb-3">
      <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
        {fieldDef.label}
        {fieldDef.type === 'cidr' && (
          <span className="ml-1 text-slate-600 normal-case tracking-normal font-normal">{fieldDef.help}</span>
        )}
      </label>
      {fieldDef.type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={base}>
          <option value="">— select —</option>
          {fieldDef.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : fieldDef.type === 'textarea' ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={fieldDef.placeholder} rows={2} className={`${base} resize-none`} />
      ) : (
        <input type={fieldDef.type === 'number' ? 'number' : 'text'} value={value}
          onChange={(e) => onChange(e.target.value)} placeholder={fieldDef.placeholder} className={base} />
      )}
    </div>
  );
}

type DestroyPhase = 'idle' | 'confirm' | 'destroying' | 'polling' | 'success' | 'error';

export default function PropertiesPanel({ node, onClose, onUpdate, deployedNodeInfo, onNodeDestroyed }: Props) {
  if (!node) return null;

  const resource = node.data;
  const fields   = getFieldsForResource(resource.id);
  const config: Record<string, string | boolean | number> = node.data.config ?? {};

  const getValue = (field: FieldDef) => {
    const v = config[field.key];
    if (v !== undefined) return v;
    return field.defaultValue ?? (field.type === 'toggle' ? false : '');
  };

  const set = (key: string, value: string | boolean | number) => onUpdate(node.id, { ...config, [key]: value });

  const toggleFields = fields.filter((f) => f.type === 'toggle');
  const inputFields  = fields.filter((f) => f.type !== 'toggle');

  // ── Destroy state ──────────────────────────────────────────────────────────
  const [destroyPhase, setDestroyPhase] = useState<DestroyPhase>('idle');
  const [destroyError, setDestroyError] = useState('');
  const [destroyChecks, setDestroyChecks] = useState<{ name: string; status: string; conclusion: string | null }[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const commitShaRef = useRef<string>('');

  // Stop polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const stopPolling = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };

  const pollCommitStatus = useCallback((sha: string) => {
    setDestroyPhase('polling');
    const doCheck = async () => {
      try {
        const res = await fetch(`${COMMIT_STATUS_URL}?sha=${encodeURIComponent(sha)}`);
        const data = await res.json();
        setDestroyChecks(data.checks ?? []);

        if (data.overall_status === 'success') {
          stopPolling();
          setDestroyPhase('success');
          setTimeout(() => onNodeDestroyed?.(node.id), 1200);
        } else if (data.overall_status === 'failure') {
          stopPolling();
          setDestroyPhase('error');
          setDestroyError('Terraform destroy failed — check GitHub Actions logs.');
        }
      } catch { /* silently ignore poll errors */ }
    };
    doCheck();
    pollRef.current = setInterval(doCheck, 8000);
  }, [node.id, onNodeDestroyed]);

  const handleDestroy = useCallback(async () => {
    if (!deployedNodeInfo) return;
    setDestroyPhase('destroying');
    setDestroyError('');
    try {
      const res = await fetch(DESTROY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project:       deployedNodeInfo.project,
          region:        deployedNodeInfo.region,
          resource_type: deployedNodeInfo.resourceType,
          resource_name: deployedNodeInfo.resourceName,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      commitShaRef.current = data.commit_sha;
      pollCommitStatus(data.commit_sha);
    } catch (err) {
      setDestroyPhase('error');
      setDestroyError(err instanceof Error ? err.message : 'Destroy request failed');
    }
  }, [deployedNodeInfo, pollCommitStatus]);

  const isDeployed = !!deployedNodeInfo;

  return (
    <div className="w-72 h-full bg-slate-900 border-l border-slate-700/60 flex flex-col flex-shrink-0">
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${isDeployed ? 'border-emerald-800/60' : 'border-slate-700/60'}`}>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${isDeployed ? 'ring-2 ring-emerald-500/50' : ''}`}
          style={{ backgroundColor: resource.color }}
        >
          {resource.abbr}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-100 text-xs font-semibold truncate">{resource.name}</p>
          <p className={`text-[10px] truncate ${isDeployed ? 'text-emerald-500' : 'text-slate-500'}`}>
            {isDeployed ? `● live in ${deployedNodeInfo.region}` : resource.description}
          </p>
        </div>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0">
          <X size={14} />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4">
        {inputFields.length > 0 && (
          <div className="mb-2">
            {inputFields.map((field) => (
              <InputField key={field.key} fieldDef={field}
                value={String(getValue(field))} onChange={(v) => set(field.key, v)} />
            ))}
          </div>
        )}
        {toggleFields.length > 0 && (
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/40 px-3 py-1 mt-1">
            {toggleFields.map((field) => (
              <ToggleField key={field.key} fieldDef={field}
                value={Boolean(getValue(field))} onChange={(v) => set(field.key, v)} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800/60 space-y-2">
        {!isDeployed && (
          <p className="text-[9px] text-slate-600 text-center">Changes apply to this diagram only</p>
        )}

        {/* ── Destroy section (deployed nodes only) ──────────────────────── */}
        {isDeployed && destroyPhase === 'idle' && (
          <button
            onClick={() => setDestroyPhase('confirm')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-red-700/50 bg-red-950/40 text-red-400 hover:bg-red-900/50 hover:text-red-300 hover:border-red-600 transition-all"
          >
            <Trash2 size={12} />
            Destroy Resource
          </button>
        )}

        {isDeployed && destroyPhase === 'confirm' && (
          <div className="rounded-lg border border-red-700/50 bg-red-950/40 p-3 space-y-2">
            <p className="text-[10px] text-red-300 font-semibold">Destroy <span className="font-mono">{deployedNodeInfo.resourceName}</span>?</p>
            <p className="text-[9px] text-red-400/80">
              This will remove it from AWS. The change commits directly to main and triggers Terraform apply.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDestroyPhase('idle')}
                className="flex-1 px-2 py-1 rounded text-[10px] border border-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleDestroy}
                className="flex-1 px-2 py-1 rounded text-[10px] font-semibold bg-red-700 hover:bg-red-600 text-white border border-red-600 transition-colors">
                Yes, Destroy
              </button>
            </div>
          </div>
        )}

        {isDeployed && (destroyPhase === 'destroying' || destroyPhase === 'polling') && (
          <div className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-3 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 text-[10px] font-semibold">
              <RefreshCw size={11} className="animate-spin" />
              {destroyPhase === 'destroying' ? 'Committing destroy…' : 'Waiting for Terraform apply…'}
            </div>
            {destroyChecks.map((c, i) => (
              <div key={i} className="text-[9px] text-amber-400/70 font-mono">
                {c.name}: {c.status === 'in_progress' ? '⏳ running' : c.conclusion ?? c.status}
              </div>
            ))}
          </div>
        )}

        {isDeployed && destroyPhase === 'success' && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-700/50 bg-emerald-950/40 text-emerald-300 text-[10px] font-semibold">
            <CheckCircle size={12} />
            Destroyed — removing from canvas…
          </div>
        )}

        {isDeployed && destroyPhase === 'error' && (
          <div className="rounded-lg border border-red-700/50 bg-red-950/40 p-3 space-y-2">
            <div className="flex items-center gap-2 text-red-300 text-[10px] font-semibold">
              <XCircle size={11} />
              Destroy failed
            </div>
            <p className="text-[9px] text-red-400/80">{destroyError}</p>
            <button onClick={() => { setDestroyPhase('idle'); setDestroyError(''); }}
              className="text-[9px] text-red-400 hover:text-red-300 underline">
              Try again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
