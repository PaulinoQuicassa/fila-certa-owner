import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { createInstitution, deleteInstitution, listInstitutions } from '../lib/admin';
import type { Institution } from '../types';

export function Institutions() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setInstitutions(await listInstitutions());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createInstitution(id.trim(), name.trim());
      setId('');
      setName('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a instituição.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(inst: Institution) {
    if (!confirm(`Remover "${inst.name}"? Só é possível se não tiver filiais nem colaboradores associados.`)) return;
    setError(null);
    try {
      await deleteInstitution(inst.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover.');
    }
  }

  return (
    <>
      <div style={{ fontSize: 22, fontWeight: 800 }}>Instituições</div>

      <form onSubmit={handleCreate} className="fc-card" style={{ padding: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--fc-text-secondary)', flex: '1 1 160px' }}>
          Identificador (ex.: bfa)
          <input className="fc-input" required value={id} onChange={(e) => setId(e.target.value)} placeholder="id-curto" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--fc-text-secondary)', flex: '2 1 260px' }}>
          Nome
          <input className="fc-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da instituição" />
        </label>
        <button type="submit" disabled={busy} className="fc-btn fc-btn--primary">
          {busy ? 'A criar…' : 'Criar instituição'}
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
        ) : institutions.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13.5, color: 'var(--fc-text-secondary)' }}>Ainda sem instituições.</div>
        ) : (
          institutions.map((inst) => (
            <div
              key={inst.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--fc-border)' }}
            >
              <Link to={`/instituicoes/${inst.id}`} style={{ fontWeight: 700, color: 'var(--fc-text-primary)', textDecoration: 'none' }}>
                {inst.name} <span style={{ fontWeight: 500, color: 'var(--fc-text-secondary)', fontSize: 12.5 }}>({inst.id})</span>
              </Link>
              <button className="fc-btn fc-btn--secondary" style={{ color: 'var(--fc-danger)' }} onClick={() => handleDelete(inst)}>
                Remover
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
