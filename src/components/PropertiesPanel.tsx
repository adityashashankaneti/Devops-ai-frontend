import { X } from 'lucide-react';
import { Node } from 'reactflow';
import { AWSResource } from '../types';
import { getFieldsForResource, FieldDef } from '../data/resourceFields';

interface Props {
  node: Node<AWSResource> | null;
  onClose: () => void;
  onUpdate: (nodeId: string, config: Record<string, string | boolean | number>) => void;
}

function ToggleField({
  fieldDef,
  value,
  onChange,
}: {
  fieldDef: FieldDef;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0">
      <span className="text-slate-300 text-xs">{fieldDef.label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${
          value ? 'bg-indigo-600' : 'bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            value ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function InputField({
  fieldDef,
  value,
  onChange,
}: {
  fieldDef: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const base =
    'w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500/60 transition-colors placeholder:text-slate-600';

  return (
    <div className="mb-3">
      <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
        {fieldDef.label}
        {(fieldDef.type === 'cidr') && (
          <span className="ml-1 text-slate-600 normal-case tracking-normal font-normal">
            {fieldDef.help}
          </span>
        )}
      </label>
      {fieldDef.type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={base}>
          <option value="">— select —</option>
          {fieldDef.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : fieldDef.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fieldDef.placeholder}
          rows={2}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          type={fieldDef.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fieldDef.placeholder}
          className={base}
        />
      )}
    </div>
  );
}

export default function PropertiesPanel({ node, onClose, onUpdate }: Props) {
  if (!node) return null;

  const resource = node.data;
  const fields = getFieldsForResource(resource.id);
  const config: Record<string, string | boolean | number> = node.data.config ?? {};

  const getValue = (field: FieldDef) => {
    const v = config[field.key];
    if (v !== undefined) return v;
    return field.defaultValue ?? (field.type === 'toggle' ? false : '');
  };

  const set = (key: string, value: string | boolean | number) => {
    onUpdate(node.id, { ...config, [key]: value });
  };

  const toggleFields = fields.filter((f) => f.type === 'toggle');
  const inputFields = fields.filter((f) => f.type !== 'toggle');

  return (
    <div className="w-72 h-full bg-slate-900 border-l border-slate-700/60 flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/60">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
          style={{ backgroundColor: resource.color }}
        >
          {resource.abbr}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-100 text-xs font-semibold truncate">{resource.name}</p>
          <p className="text-slate-500 text-[10px] truncate">{resource.description}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4">
        {inputFields.length > 0 && (
          <div className="mb-2">
            {inputFields.map((field) => (
              <InputField
                key={field.key}
                fieldDef={field}
                value={String(getValue(field))}
                onChange={(v) => set(field.key, v)}
              />
            ))}
          </div>
        )}

        {toggleFields.length > 0 && (
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/40 px-3 py-1 mt-1">
            {toggleFields.map((field) => (
              <ToggleField
                key={field.key}
                fieldDef={field}
                value={Boolean(getValue(field))}
                onChange={(v) => set(field.key, v)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800/60">
        <p className="text-[9px] text-slate-600 text-center">
          Changes apply to this diagram only
        </p>
      </div>
    </div>
  );
}
