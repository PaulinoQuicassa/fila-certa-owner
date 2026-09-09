import type { ReactNode } from 'react';

export function SidePanel({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fc-card" style={{ width: 380, flexShrink: 0, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: subtitle ? 4 : 16 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700 }}>{title}</div>
        <button
          onClick={onClose}
          style={{ width: 26, height: 26, border: 'none', background: 'var(--surface-alt)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4B5768" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        </button>
      </div>
      {subtitle && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 14 }}>{subtitle}</div>}
      {children}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.02em' }}>{children}</div>;
}

export function PillSelect<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`fc-pill fc-pill--toggle${opt === value ? ' active' : ''}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function MultiPillSelect({ options, values, onToggle }: { options: readonly string[]; values: string[]; onToggle: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={`fc-pill fc-pill--toggle${values.includes(opt) ? ' active' : ''}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
