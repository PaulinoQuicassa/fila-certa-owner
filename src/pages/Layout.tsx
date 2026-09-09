import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

export type TabId = 'empresas' | 'perfis' | 'colaboradores' | 'donos';

const TABS: { id: TabId; label: string }[] = [
  { id: 'empresas', label: 'Empresas' },
  { id: 'perfis', label: 'Perfis de acesso' },
  { id: 'colaboradores', label: 'Colaboradores' },
  { id: 'donos', label: 'Donos' },
];

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1E4FA3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4z" />
      <line x1="12" y1="6" x2="12" y2="18" strokeDasharray="2 3" />
    </svg>
  );
}

export function Layout({ tab, onTabChange, children }: { tab: TabId; onTabChange: (t: TabId) => void; children: ReactNode }) {
  const { profile, logout } = useAuth();
  const initials = (profile?.name ?? '').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ padding: '20px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: '1px solid var(--border)', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Logo />
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>Fila Certa</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Owner</div>
            </div>
            <div style={{ width: 1, height: 32, background: 'var(--border)', margin: '0 4px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-alt)', padding: '7px 14px', borderRadius: 10 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>Acesso global</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>todas as empresas</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', width: 220, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7C8797" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" />
              </svg>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Pesquisar…</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16, borderLeft: '1px solid var(--border)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                {initials || '?'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{profile?.name}</div>
              <button onClick={() => logout()} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', background: 'none', border: 'none' }}>
                Sair
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                style={{
                  padding: '9px 18px', border: 'none', borderBottom: `2px solid ${active ? 'var(--brand-blue)' : 'transparent'}`,
                  background: 'transparent', fontSize: 14, fontWeight: 700, color: active ? 'var(--brand-blue)' : 'var(--text-muted)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ padding: '0 32px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</div>
    </div>
  );
}
