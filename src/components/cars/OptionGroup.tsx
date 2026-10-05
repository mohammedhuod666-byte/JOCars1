'use client';

import { AlertCircle, ChevronDown } from 'lucide-react';

/**
 * Compact radio group used across the history/service/customs sections.
 *
 * Built as a fieldset with radios (not buttons) so keyboard navigation, screen
 * readers and form semantics all work without extra ARIA. Options wrap to a
 * grid so a 5-item scale stays readable on a phone.
 */
export default function OptionGroup({
  name, label, hint, options, value, onChange, columns = 2, required,
}: {
  name: string;
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  columns?: 1 | 2 | 3;
  required?: boolean;
}) {
  const grid = columns === 3 ? 'sm:grid-cols-3' : columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1';

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-bold text-slate-300">
        {label}
        {required && <span className="text-rose-400"> *</span>}
      </legend>
      {hint && <p className="text-[11px] leading-relaxed text-slate-500">{hint}</p>}

      <div className={`grid grid-cols-1 ${grid} gap-2`}>
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <label
              key={o.value}
              className={`flex items-center gap-2 px-3.5 py-3 rounded-2xl border text-xs font-bold cursor-pointer transition-all ${
                selected
                  ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={selected}
                onChange={() => onChange(o.value)}
                className="w-4 h-4 shrink-0 accent-emerald-500 cursor-pointer"
              />
              <span className="leading-snug">{o.label}</span>
            </label>
          );
        })}
      </div>

      {value === '' && (
        <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <ChevronDown className="w-3.5 h-3.5" />
          اختياري — تركه فارغ يعني «لم يُصرّح»
        </p>
      )}
    </fieldset>
  );
}

/** Yes/No/Unknown switch used for boolean-ish declarations. */
export function YesNoUnknown({
  name, label, hint, value, onChange,
}: {
  name: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const opts = [
    { value: 'NO', label: 'لا' },
    { value: 'YES', label: 'نعم' },
    { value: 'UNKNOWN', label: 'غير معروف' },
  ];
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-bold text-slate-300">{label}</legend>
      {hint && <p className="text-[11px] leading-relaxed text-slate-500">{hint}</p>}
      <div className="grid grid-cols-3 gap-2">
        {opts.map((o) => {
          const sel = value === o.value;
          return (
            <label
              key={o.value}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl border text-xs font-bold cursor-pointer transition-all ${
                sel
                  ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={sel}
                onChange={() => onChange(o.value)}
                className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Declared-data disclaimer shown above seller-declaration blocks. */
export function DeclarationNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500 bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5">
      <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0 text-slate-600" />
      <span>{children}</span>
    </p>
  );
}
