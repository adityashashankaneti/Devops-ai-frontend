import { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import { Rocket, Eye, X, CheckCircle, XCircle, Loader2, Copy, Check, ChevronDown, ExternalLink, RefreshCw, Download } from 'lucide-react';
import { buildDeployPayload, DeployPayload } from '../utils/deployPayload';
import { loadCanvasFromImport } from './ArchitectureCanvas';

const DEPLOY_URL  = import.meta.env.VITE_DEPLOY_URL  ?? 'http://localhost:8000/api/deploy';
const STATUS_URL  = import.meta.env.VITE_STATUS_URL  ?? 'http://localhost:8000/api/status';
const IMPORT_URL  = import.meta.env.VITE_IMPORT_URL  ?? 'http://localhost:8000/api/import';

const REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
  'eu-west-1', 'eu-west-2', 'eu-central-1',
  'sa-east-1',
];

const MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6', description: 'Fast & cost-efficient' },
  { id: 'claude-opus-4-6',   label: 'Opus 4.6',   description: 'Most capable' },
] as const;

type ModelId = typeof MODELS[number]['id'];

interface DeployResult {
  branch: string;
  commit_sha: string;
  pr_url: string | null;
  files_written: string[];
  module_types: string[];
  resource_count: number;
}

interface CICheck {
  name: string;
  status: string;
  conclusion: string | null;
  details_url: string | null;
}

interface CIStatus {
  overall_status: 'pending' | 'in_progress' | 'success' | 'failure';
  pr_state: string;
  pr_merged: boolean;
  checks: CICheck[];
}

interface Props {
  nodes: Node[];
  edges: Edge[];
  onDeployStarted?: (project: string, region: string) => void;
  onApplySucceeded?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onImportSucceeded?: (importedNodes: any[], project: string, region: string) => void;
}

export default function DeployBar({ nodes, edges, onDeployStarted, onApplySucceeded, onImportSucceeded }: Props) {
  const [region, setRegion] = useState('us-east-1');
  const [model, setModel] = useState<ModelId>('claude-sonnet-4-6');
  const [projectName, setProjectName] = useState('my-infra');
  const [projectNameError, setProjectNameError] = useState('');
  const [deployStatus, setDeployStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ciStatus, setCiStatus] = useState<CIStatus | null>(null);
  const [pollingActive, setPollingActive] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [importError, setImportError] = useState('');

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const pollCIStatus = useCallback((prUrl: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setPollingActive(true);
    setCiStatus(null);

    const doCheck = async () => {
      try {
        const res = await fetch(`${STATUS_URL}?pr_url=${encodeURIComponent(prUrl)}`);
        if (!res.ok) return;
        const data = await res.json();
        setCiStatus(data);

        // Stop polling on terminal states
        if (data.overall_status === 'success' || data.overall_status === 'failure' || data.pr_merged) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setPollingActive(false);
          // Mark nodes as deployed when apply succeeds after PR merge
          if (data.overall_status === 'success' && data.pr_merged) {
            onApplySucceeded?.();
          }
        }
      } catch {
        // Silently ignore polling errors
      }
    };

    doCheck();
    pollIntervalRef.current = setInterval(doCheck, 10000); // poll every 10s
  }, [onApplySucceeded]);

  const getPayload = useCallback((): DeployPayload & { model: ModelId } => {
    return { ...buildDeployPayload(nodes, edges, projectName, region), model };
  }, [nodes, edges, projectName, region, model]);

  const PROJECT_NAME_RE = /^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$|^[a-z0-9]{1,2}$/;

  const handleDeploy = useCallback(async () => {
    if (nodes.length === 0) return;
    if (deployStatus === 'loading') return;
    if (!PROJECT_NAME_RE.test(projectName)) {
      setProjectNameError('Use lowercase letters, numbers, and hyphens only (e.g. my-infra)');
      return;
    }
    setProjectNameError('');

    const payload = getPayload();
    setDeployStatus('loading');
    setErrorMsg('');
    setDeployResult(null);
    onDeployStarted?.(projectName, region);

    try {
      const res = await fetch(DEPLOY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDeployResult(data);
      setDeployStatus('success');

      // Start polling CI status if we got a PR URL
      if (data.pr_url) {
        pollCIStatus(data.pr_url);
      }
    } catch (err) {
      setDeployStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Deployment failed');
    }
  }, [nodes, deployStatus, projectName, region, getPayload, onDeployStarted]);

  const handleImport = useCallback(async () => {
    if (importStatus === 'loading') return;
    if (!PROJECT_NAME_RE.test(projectName)) {
      setProjectNameError('Use lowercase letters, numbers, and hyphens only (e.g. my-infra)');
      return;
    }
    if (nodes.length > 0) {
      const ok = window.confirm(
        'This will replace your current canvas with resources from the Terraform state file. Continue?'
      );
      if (!ok) return;
    }
    setImportStatus('loading');
    setImportError('');
    try {
      const url = `${IMPORT_URL}?project=${encodeURIComponent(projectName)}&region=${encodeURIComponent(region)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      loadCanvasFromImport(data.nodes, data.edges);
      onImportSucceeded?.(data.nodes, projectName, region);
      setImportStatus('idle');
    } catch (err) {
      setImportStatus('error');
      setImportError(err instanceof Error ? err.message : 'Import failed');
      setTimeout(() => setImportStatus('idle'), 5000);
    }
  }, [importStatus, projectName, region, nodes.length, onImportSucceeded]);

  const handleCopy = useCallback(() => {
    const json = JSON.stringify(getPayload(), null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getPayload]);

  const payload = showPreview ? getPayload() : null;
  const resourceCount = nodes.length;
  const connectionCount = edges.length;
  const isEmpty = nodes.length === 0;

  return (
    <>
      {/* ── Deploy Bar ───────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-50">
        {/* Status banners */}
        {deployStatus === 'success' && deployResult && (
          <div className="flex flex-col border-t border-emerald-600/60 bg-emerald-950/95">
            {/* Main success row */}
            <div className="flex items-center justify-center gap-3 text-emerald-300 text-xs px-4 py-2.5">
              <CheckCircle size={13} className="flex-shrink-0" />
              <span>
                Pushed <span className="font-semibold">{deployResult.resource_count}</span> resources
                ({deployResult.module_types?.join(', ')}) to{' '}
                <span className="font-mono font-semibold">{deployResult.branch}</span>
              </span>
              {deployResult.pr_url && (
                <a
                  href={deployResult.pr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-800/50 border border-emerald-600/40 hover:bg-emerald-700/50 transition-colors"
                >
                  <ExternalLink size={10} />
                  View PR
                </a>
              )}
              <button
                onClick={() => {
                  setDeployStatus('idle');
                  setDeployResult(null);
                  setCiStatus(null);
                  setPollingActive(false);
                  if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                }}
                className="ml-2 text-emerald-500 hover:text-emerald-300 transition-colors"
              >
                <X size={12} />
              </button>
            </div>

            {/* CI Status row */}
            {(ciStatus || pollingActive) && (
              <div className="flex items-center justify-center gap-3 text-xs px-4 py-2 border-t border-emerald-800/40">
                {!ciStatus || ciStatus.overall_status === 'pending' || ciStatus.overall_status === 'in_progress' ? (
                  <>
                    <RefreshCw size={12} className="animate-spin text-amber-400" />
                    <span className="text-amber-300">
                      Terraform {ciStatus?.overall_status === 'in_progress' ? 'running' : 'queued'}...
                    </span>
                    {ciStatus?.checks?.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/40 text-slate-400">
                        {c.name}: {c.status === 'in_progress' ? '⏳ running' : c.status === 'completed' ? (c.conclusion === 'success' ? '✓' : c.conclusion === 'skipped' ? '⊘ skipped' : '✗') : '⏸ queued'}
                      </span>
                    ))}
                  </>
                ) : ciStatus.overall_status === 'success' ? (
                  <>
                    <CheckCircle size={12} className="text-emerald-400" />
                    <span className="text-emerald-300">Terraform plan succeeded</span>
                    {ciStatus.checks?.map((c, i) => (
                      <span key={i} className={`px-2 py-0.5 rounded border ${c.conclusion === 'skipped' ? 'bg-slate-800/60 border-slate-700/40 text-slate-500' : 'bg-emerald-900/40 border-emerald-700/30 text-emerald-400'}`}>
                        {c.name}: {c.conclusion === 'skipped' ? '⊘ skipped' : '✓'}
                      </span>
                    ))}
                  </>
                ) : (
                  <>
                    <XCircle size={12} className="text-red-400" />
                    <span className="text-red-300">Terraform failed</span>
                    {ciStatus.checks?.filter(c => c.conclusion === 'failure').map((c, i) => (
                      <a
                        key={i}
                        href={c.details_url ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded bg-red-900/40 border border-red-700/30 text-red-400 hover:text-red-300"
                      >
                        {c.name}: ✗ (view logs)
                      </a>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
        {deployStatus === 'error' && (
          <div className="flex items-center justify-center gap-2 bg-red-950/95 border-t border-red-700/60 text-red-300 text-xs px-4 py-2">
            <XCircle size={13} />
            {errorMsg || 'Deployment failed — check backend connection'}
            <button
              onClick={() => setDeployStatus('idle')}
              className="ml-2 text-red-500 hover:text-red-300 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Main bar */}
        <div className="bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/60 px-5 py-2.5 flex items-center gap-4">
          {/* Resource count */}
          <div className="flex items-center gap-3 text-xs text-slate-500 mr-2">
            <span>
              <span className="text-slate-300 font-semibold">{resourceCount}</span> resource{resourceCount !== 1 ? 's' : ''}
            </span>
            <span className="text-slate-700">•</span>
            <span>
              <span className="text-slate-300 font-semibold">{connectionCount}</span> connection{connectionCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="w-px h-5 bg-slate-700/60" />

          {/* Project name */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Project</label>
            <div className="flex flex-col gap-0.5">
              <input
                type="text"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  if (projectNameError) setProjectNameError('');
                }}
                className={`bg-slate-800/80 border rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none w-28 transition-colors placeholder:text-slate-600 ${
                  projectNameError ? 'border-red-500/70 focus:border-red-400' : 'border-slate-700/60 focus:border-indigo-500/60'
                }`}
                placeholder="my-infra"
              />
              {projectNameError && (
                <span className="text-[9px] text-red-400 leading-tight">{projectNameError}</span>
              )}
            </div>
          </div>

          {/* Region selector */}
          <div className="flex items-center gap-2 relative">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Region</label>
            <div className="relative">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1 pr-7 text-xs text-slate-200 outline-none focus:border-indigo-500/60 appearance-none cursor-pointer transition-colors"
              >
                {REGIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
              </select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Model selector */}
          <div className="flex items-center gap-2 relative">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Model</label>
            <div className="relative">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as ModelId)}
                className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1 pr-7 text-xs text-slate-200 outline-none focus:border-indigo-500/60 appearance-none cursor-pointer transition-colors"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label} — {m.description}</option>
                ))}
              </select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Import from state */}
          <button
            onClick={handleImport}
            disabled={importStatus === 'loading'}
            title={importError || 'Load resources from your Terraform state file in S3'}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200
              ${importStatus === 'loading'
                ? 'bg-slate-800/40 border-slate-700/30 text-slate-500 cursor-not-allowed'
                : importStatus === 'error'
                ? 'bg-red-900/40 border-red-700/50 text-red-400 hover:bg-red-900/60'
                : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 hover:bg-slate-700/50'
              }`}
          >
            {importStatus === 'loading' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            {importStatus === 'loading' ? 'Importing…' : importStatus === 'error' ? 'Import failed' : 'Import State'}
          </button>

          {/* Preview JSON */}
          <button
            onClick={() => setShowPreview(true)}
            disabled={isEmpty}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200
              ${isEmpty
                ? 'bg-slate-800/40 border-slate-700/30 text-slate-600 cursor-not-allowed'
                : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 hover:bg-slate-700/50'
              }`}
          >
            <Eye size={13} />
            Preview JSON
          </button>

          {/* Deploy */}
          <button
            onClick={handleDeploy}
            disabled={isEmpty || deployStatus === 'loading'}
            className={`flex items-center gap-2.5 px-6 py-2 rounded-xl font-semibold text-sm shadow-xl transition-all duration-200 border
              ${isEmpty
                ? 'bg-slate-800/40 border-slate-700/30 text-slate-600 cursor-not-allowed'
                : deployStatus === 'loading'
                ? 'bg-indigo-700/60 border-indigo-500/40 text-indigo-300 cursor-not-allowed'
                : deployStatus === 'success'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : deployStatus === 'error'
                ? 'bg-red-700 border-red-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500/60 hover:border-indigo-400 text-white hover:shadow-indigo-500/25'
              }`}
          >
            {deployStatus === 'loading' ? (
              <Loader2 size={15} className="animate-spin" />
            ) : deployStatus === 'success' ? (
              <CheckCircle size={15} />
            ) : deployStatus === 'error' ? (
              <XCircle size={15} />
            ) : (
              <Rocket size={15} />
            )}
            {deployStatus === 'loading'
              ? 'Deploying…'
              : deployStatus === 'success'
              ? 'Deployed!'
              : deployStatus === 'error'
              ? 'Failed'
              : 'Deploy Infrastructure'}
          </button>
        </div>
      </div>

      {/* ── JSON Preview Modal ────────────────────────────────────────── */}
      {showPreview && payload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPreview(false)}
          />

          {/* Modal */}
          <div className="relative bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl w-[680px] max-h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/60">
              <div>
                <h3 className="text-slate-100 text-sm font-semibold">Deploy Payload Preview</h3>
                <p className="text-slate-500 text-[10px] mt-0.5">
                  This JSON will be sent to <span className="text-slate-400 font-mono">{DEPLOY_URL}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-slate-500 hover:text-slate-200 transition-colors p-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Summary badges */}
            <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-800/60">
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-300">
                {payload.region}
              </span>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/60 text-slate-300">
                {payload.project}
              </span>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-violet-900/40 border border-violet-600/40 text-violet-300">
                {MODELS.find(m => m.id === model)?.label ?? model}
              </span>
              <span className="text-[10px] text-slate-500">
                {payload.resources.length} top-level resource{payload.resources.length !== 1 ? 's' : ''} ·{' '}
                {payload.connections.length} connection{payload.connections.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* JSON body */}
            <div className="flex-1 overflow-auto p-5">
              <pre className="text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-700/60">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium border bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleDeploy();
                }}
                disabled={isEmpty || deployStatus === 'loading'}
                className="flex items-center gap-2 px-5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/60 transition-all shadow-lg shadow-indigo-500/20"
              >
                <Rocket size={13} />
                Deploy Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
