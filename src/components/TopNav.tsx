import { useState, useEffect, useCallback } from 'react';
import { Layers, MessageSquare, Zap, GitBranch, Save, Check } from 'lucide-react';
import { AppMode } from '../types';

interface Props {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export default function TopNav({ mode, onModeChange }: Props) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const handler = (e: CustomEvent) => setSaveStatus(e.detail);
    window.addEventListener('canvas-save-status' as never, handler as EventListener);
    return () => window.removeEventListener('canvas-save-status' as never, handler as EventListener);
  }, []);

  const handleSave = useCallback(() => {
    window.dispatchEvent(new CustomEvent('canvas-save'));
  }, []);

  return (
    <nav className="h-14 bg-slate-900 border-b border-slate-700/60 flex items-center px-5 gap-6 z-50 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-2">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Zap size={15} className="text-white" />
        </div>
        <div>
          <span className="text-white font-semibold text-sm tracking-wide">DevOps</span>
          <span className="text-indigo-400 font-semibold text-sm tracking-wide"> AI</span>
        </div>
      </div>

      <div className="w-px h-6 bg-slate-700 mx-1" />

      {/* Mode Switcher */}
      <div className="flex items-center gap-1 bg-slate-800/80 rounded-lg p-1 border border-slate-700/50">
        <button
          onClick={() => onModeChange('architecture')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
            mode === 'architecture'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          <Layers size={13} />
          Architecture
        </button>
        <button
          onClick={() => onModeChange('chatbot')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
            mode === 'chatbot'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          <MessageSquare size={13} />
          DevOps Chatbot
        </button>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-4">
        {mode === 'architecture' && (
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
              saveStatus === 'saved'
                ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 hover:bg-slate-700/50'
            }`}
            title="Save (auto-saves after changes)"
          >
            {saveStatus === 'saved' ? <Check size={12} /> : <Save size={12} />}
            {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Save'}
          </button>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <GitBranch size={12} />
          <span>main</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400 text-xs">Ready</span>
        </div>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
          A
        </div>
      </div>
    </nav>
  );
}
