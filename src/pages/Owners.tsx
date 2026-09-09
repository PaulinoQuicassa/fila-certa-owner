import { useEffect, useState, type FormEvent } from 'react';
import { addOwner, listOwners, removeOwner } from '../lib/admin';
import { useAuth } from '../auth/AuthContext';
import type { Owner } from '../types';

export function Owners() {
  const { profile } = useAuth();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setOwners(await listOwners());
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

  return (
    <>
      <div style={{ fontSize: 22, fontWeight: 800 }}>Donos da plataforma</div>
      <div style={{ fontSize: 12.5, color: 'var(--fc-text-secondary)', marginTop: -12 }}>
        Acesso total, sem âmbito de filial. A conta de login também tem de já existir no Dashboard do Supabase.
      </div>

      <form onSubmit={handleAdd} className="fc-card" style={{ padding: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--fc-text-secondary)', flex: '2 1 220px' }}>
          Email da conta já criada
          <input type="email" className="fc-input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dono@exemplo.test" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--fc-text-secondary)', flex: '2 1 200px' }}>
          Nome
          <input className="fc-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
        </label>
        <button type="submit" disabled={busy} className="fc-btn fc-btn--primary">
          {busy ? 'A adicionar…' : 'Adicionar dono'}
        </button>
      </form>

      {error && (
        <div className="fc-card" style={{ background: 'var(--fc-danger-bg)', boxShadow: 'none', padding: '12px 16px', fontSize: 13.5, color: 'var(--fc-danger)' }}>
          {error}
        </div>
      )}

      <div className="fc-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, fontSize: 13.5, color: 'var(--fc-text-secondary)' }}>A carregar…</div>
        ) : (
          owners.map((o) => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--fc-border)' }}>
              <div>
                <div style={{ fontWeight: 700 }}>
                  {o.name} {o.id === profile?.uid && <span style={{ fontWeight: 500, color: 'var(--fc-text-secondary)', fontSize: 12.5 }}>(você)</span>}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--fc-text-secondary)' }}>{o.email}</div>
              </div>
              <button className="fc-btn fc-btn--secondary" style={{ color: 'var(--fc-danger)' }} onClick={() => handleRemove(o)}>
                Remover
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
