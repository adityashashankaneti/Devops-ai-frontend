import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { awsResourceCategories, allAWSResources } from '../data/awsResources';
import { AWSResource, CloudProvider, ConnectorType } from '../types';

const cloudProviders: { id: CloudProvider; name: string; color: string }[] = [
  { id: 'aws', name: 'AWS', color: '#FF9900' },
  { id: 'azure', name: 'Azure', color: '#0078D4' },
  { id: 'gcp', name: 'GCP', color: '#4285F4' },
];

const CONNECTORS: { id: ConnectorType; label: string; preview: React.ReactNode }[] = [
  {
    id: 'default',
    label: 'Arrow',
    preview: (
      <svg width="32" height="10" viewBox="0 0 32 10">
        <line x1="2" y1="5" x2="26" y2="5" stroke="#6366f1" strokeWidth="2" />
        <polygon points="26,2 32,5 26,8" fill="#6366f1" />
      </svg>
    ),
  },
  {
    id: 'dashed',
    label: 'Dashed',
    preview: (
      <svg width="32" height="10" viewBox="0 0 32 10">
        <line x1="2" y1="5" x2="26" y2="5" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 3" />
        <polygon points="26,2 32,5 26,8" fill="#94a3b8" />
      </svg>
    ),
  },
  {
    id: 'thick',
    label: 'Thick',
    preview: (
      <svg width="32" height="10" viewBox="0 0 32 10">
        <line x1="2" y1="5" x2="25" y2="5" stroke="#6366f1" strokeWidth="4" />
        <polygon points="25,1 32,5 25,9" fill="#6366f1" />
      </svg>
    ),
  },
  {
    id: 'bidirectional',
    label: 'Bidir',
    preview: (
      <svg width="32" height="10" viewBox="0 0 32 10">
        <line x1="6" y1="5" x2="26" y2="5" stroke="#10b981" strokeWidth="2" />
        <polygon points="6,2 0,5 6,8" fill="#10b981" />
        <polygon points="26,2 32,5 26,8" fill="#10b981" />
      </svg>
    ),
  },
];

interface Props {
  onResourceDragStart: (e: React.DragEvent, resource: AWSResource) => void;
  onResourceClick: (resource: AWSResource) => void;
  connectorType: ConnectorType;
  onConnectorChange: (type: ConnectorType) => void;
}

function ResourceTile({
  resource,
  onDragStart,
  onClick,
}: {
  resource: AWSResource;
  onDragStart: (e: React.DragEvent, r: AWSResource) => void;
  onClick: (r: AWSResource) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, resource)}
      onClick={() => onClick(resource)}
      className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 cursor-pointer border border-slate-700/50 hover:border-slate-500/70 transition-all group select-none"
      title={`${resource.description} · click or drag to add`}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-md"
        style={{ backgroundColor: resource.color }}
      >
        {resource.abbr}
      </div>
      <span className="text-slate-500 text-[9px] text-center leading-tight group-hover:text-slate-300 transition-colors font-medium">
        {resource.name}
      </span>
    </div>
  );
}

export default function LeftSidebar({ onResourceDragStart, onResourceClick, connectorType, onConnectorChange }: Props) {
  const [provider, setProvider] = useState<CloudProvider>('aws');
  const [expanded, setExpanded] = useState<string[]>(['networking', 'compute']);
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allAWSResources
      .filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.abbr.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [searchQuery]);

  const toggleCategory = (id: string) =>
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );

  return (
    <div className="w-64 h-full bg-slate-900 border-r border-slate-700/60 flex flex-col flex-shrink-0">

      {/* Cloud Provider */}
      <div className="p-3 border-b border-slate-700/60">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-semibold">
          Cloud Provider
        </p>
        <div className="flex gap-1">
          {cloudProviders.map((cp) => (
            <button
              key={cp.id}
              onClick={() => setProvider(cp.id)}
              className={`flex-1 py-1.5 px-1 rounded-md text-[10px] font-semibold transition-all duration-200 ${
                provider === cp.id
                  ? 'text-white shadow-lg'
                  : 'text-slate-500 bg-slate-800/60 hover:bg-slate-800 hover:text-slate-300'
              }`}
              style={provider === cp.id ? { backgroundColor: cp.color } : {}}
            >
              {cp.name}
            </button>
          ))}
        </div>
        {provider !== 'aws' && (
          <p className="text-[9px] text-slate-600 mt-2 text-center">
            {provider === 'azure' ? 'Azure' : 'GCP'} resources coming soon
          </p>
        )}
      </div>

      {/* Connectors */}
      <div className="p-3 border-b border-slate-700/60">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-semibold">
          Connectors
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {CONNECTORS.map((c) => (
            <button
              key={c.id}
              onClick={() => onConnectorChange(c.id)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all text-[10px] font-medium ${
                connectorType === c.id
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-800/60 border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-600'
              }`}
            >
              {c.preview}
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Categories */}
      <div className="flex-1 overflow-y-auto">
        {awsResourceCategories.map((category) => {
          const isOpen = expanded.includes(category.id);
          return (
            <div key={category.id} className="border-b border-slate-800/60 last:border-0">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
              >
                <span>{category.name}</span>
                {isOpen ? (
                  <ChevronDown size={12} className="text-slate-500" />
                ) : (
                  <ChevronRight size={12} className="text-slate-600" />
                )}
              </button>
              {isOpen && (
                <div className="px-2 pb-2.5 grid grid-cols-3 gap-1.5">
                  {category.resources.map((resource) => (
                    <ResourceTile
                      key={resource.id}
                      resource={resource}
                      onDragStart={onResourceDragStart}
                      onClick={onResourceClick}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Search */}
      <div className="border-t border-slate-700/60 p-2 relative">
        {searchResults.length > 0 && (
          <div className="absolute bottom-full left-2 right-2 bg-slate-800 border border-slate-600/80 rounded-xl overflow-hidden shadow-2xl shadow-black/50 mb-1">
            <div className="px-3 py-1.5 border-b border-slate-700/60">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {searchResults.map((resource) => (
                <div
                  key={resource.id}
                  draggable
                  onDragStart={(e) => {
                    onResourceDragStart(e, resource);
                  }}
                  onDragEnd={() => setSearchQuery('')}
                  onClick={() => {
                    onResourceClick(resource);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-700/60 cursor-pointer border-b border-slate-700/40 last:border-0 transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                    style={{ backgroundColor: resource.color }}
                  >
                    {resource.abbr}
                  </div>
                  <div className="min-w-0">
                    <div className="text-slate-200 text-xs font-medium truncate">{resource.name}</div>
                    <div className="text-slate-500 text-[9px] truncate">{resource.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-700/60 focus-within:border-indigo-500/60 focus-within:bg-slate-800 transition-all">
          <Search size={12} className="text-slate-500 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search AWS resources..."
            className="bg-transparent text-slate-200 text-xs outline-none flex-1 placeholder:text-slate-600 min-w-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-500 hover:text-slate-300 flex-shrink-0 transition-colors"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
