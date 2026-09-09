import { useEffect, useState, type FormEvent } from 'react';
import { createAccessProfile, deleteAccessProfile, listAccessProfiles } from '../lib/admin';
import { FieldLabel, MultiPillSelect, PillSelect, SidePanel } from './SidePanel';
import { ACCESS_PERMISSIONS, type AccessProfile, type ProfileScope } from '../types';

const SCOPE_LABEL: Record<ProfileScope, string> = { global: 'Fila Certa (global)', institution: 'Por empresa' };
const SCOPE_OPTIONS: ProfileScope[] = ['global', 'institution'];

function NewProfilePanel({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [scope, setScope] = useState<ProfileScope>('global');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(p: string) {
    setPermissions((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createAccessProfile(name.trim(), scope, permissions);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o perfil.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SidePanel title="Novo perfil de acesso" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <FieldLabel>Nome do perfil</FieldLabel>
          <input className="fc-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Auditor Externo" />
        </div>
        <div>
          <FieldLabel>Âmbito</FieldLabel>
          <PillSelect options={SCOPE_OPTIONS.map((s) => SCOPE_LABEL[s])} value={SCOPE_LABEL[scope]} onChange={(label) => setScope(SCOPE_OPTIONS.find((s) => SCOPE_LABEL[s] === label)!)} />
        </div>
        <div>
          <FieldLabel>Permissões</FieldLabel>
          <MultiPillSelect options={ACCESS_PERMISSIONS} values={permissions} onToggle={toggle} />
        </div>
        {error && <div style={{ fontSize: 13, color: 'var(--red)' }}>{error}</div>}
        <button type="submit" disabled={busy} className="fc-btn fc-btn--primary" style={{ width: '100%', padding: 11 }}>
          {busy ? 'A criar…' : 'Criar perfil'}
        </button>
      </form>
    </SidePanel>
  );
}

export function AccessProfiles() {
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setProfiles(await listAccessProfiles());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(p: AccessProfile) {
    if (!confirm(`Remover o perfil "${p.name}"? Quem o tiver atribuído fica sem nenhum perfil (não perde o acesso real).`)) return;
    setError(null);
    try {
      await deleteAccessProfile(p.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover.');
    }
  }

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 16 }}>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Perfis ao nível da Fila Certa (dono da aplicação) e ao nível de cada empresa cliente. Servem para organizar e
            documentar quem tem que tipo de acesso — a atribuição real de acesso continua a ser feita em Colaboradores/Donos.
          </div>
          <button onClick={() => setPanelOpen(true)} className="fc-btn fc-btn--primary" style={{ flexShrink: 0 }}>+ Novo perfil</button>
        </div>

        {error && (
          <div className="fc-card" style={{ background: 'var(--red-bg)', padding: '12px 16px', fontSize: 13.5, color: 'var(--red)', marginBottom: 14 }}>{error}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>A carregar…</div>
          ) : profiles.length === 0 ? (
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Ainda sem perfis definidos.</div>
          ) : (
            profiles.map((p) => (
              <div key={p.id} className="fc-card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                    <span className="fc-pill" style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)' }}>{SCOPE_LABEL[p.scope]}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.userCount} utilizador{p.userCount === 1 ? '' : 'es'}</div>
                    <button onClick={() => handleDelete(p)} className="fc-btn fc-btn--outline" style={{ width: 26, height: 26, padding: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D8434F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {p.permissions.length === 0 ? (
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Sem permissões atribuídas.</span>
                  ) : (
                    p.permissions.map((perm) => (
                      <span key={perm} style={{ fontSize: 11.5, color: 'var(--text-secondary)', background: 'var(--bg-page)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 20 }}>
                        {perm}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {panelOpen && <NewProfilePanel onClose={() => setPanelOpen(false)} onSaved={() => { setPanelOpen(false); refresh(); }} />}
    </div>
  );
}
