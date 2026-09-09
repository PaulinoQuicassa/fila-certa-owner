import { useEffect, useState, type FormEvent } from 'react';
import { addOwner, listAccessProfiles, listOwners, removeOwner, setOwnerProfile } from '../lib/admin';
import { useAuth } from '../auth/AuthContext';
import { FieldLabel } from './SidePanel';
import type { AccessProfile, Owner } from '../types';

export function Owners() {
  const { profile } = useAuth();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [o, p] = await Promise.all([listOwners(), listAccessProfiles()]);
      setOwners(o);
      setProfiles(p);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await addOwner(email.trim(), name.trim());
      setEmail('');
      setName('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível adicionar.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(owner: Owner) {
    if (!confirm(`Remover o acesso de dono de "${owner.name}"?`)) return;
    setError(null);
    try {
      await removeOwner(owner.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover.');
    }
  }

  async function handleProfileChange(owner: Owner, profileId: string) {
    setError(null);
    try {
      await setOwnerProfile(owner.id, profileId || null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atribuir o perfil.');
    }
  }

  return (
    <>
      <div className="fc-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
          Acesso total, sem âmbito de filial. A conta de login também tem de já existir no Dashboard do Supabase.
        </div>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 220px' }}>
            <FieldLabel>Email da conta já criada</FieldLabel>
            <input type="email" className="fc-input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dono@exemplo.test" />
          </div>
          <div style={{ flex: '2 1 200px' }}>
            <FieldLabel>Nome</FieldLabel>
            <input className="fc-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
          </div>
          <button type="submit" disabled={busy} className="fc-btn fc-btn--primary">
            {busy ? 'A adicionar…' : 'Adicionar dono'}
          </button>
        </form>
      </div>

      {error && (
        <div className="fc-card" style={{ background: 'var(--red-bg)', padding: '12px 16px', fontSize: 13.5, color: 'var(--red)' }}>{error}</div>
      )}

      <div className="fc-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, fontSize: 13.5, color: 'var(--text-muted)' }}>A carregar…</div>
        ) : (
          owners.map((o) => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)', gap: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                  {o.name} {o.id === profile?.uid && <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: 12.5 }}>(você)</span>}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{o.email}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <select className="fc-input" style={{ fontSize: 12.5, padding: '6px 8px', width: 180 }} value={o.accessProfileId ?? ''} onChange={(e) => handleProfileChange(o, e.target.value)}>
                  <option value="">— nenhum —</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button className="fc-btn fc-btn--outline" style={{ color: 'var(--red)', fontSize: 12 }} onClick={() => handleRemove(o)}>
                  Remover
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
