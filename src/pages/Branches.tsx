import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createBranch, deleteBranch, listBranches } from '../lib/admin';
import type { Branch } from '../types';

export function Branches() {
  const { institutionId = '' } = useParams<{ institutionId: string }>();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setBranches(await listBranches(institutionId));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [institutionId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createBranch(institutionId, id.trim(), name.trim());
      setId('');
      setName('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a filial.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(branch: Branch) {
    if (!confirm(`Remover "${branch.name}"? Só é possível se não tiver balcões nem senhas associadas.`)) return;
    setError(null);
    try {
      await deleteBranch(institutionId, branch.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover.');
    }
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Link to="/" style={{ fontSize: 13, color: 'var(--fc-text-secondary)' }}>← Instituições</Link>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Filiais — {institutionId}</div>
      </div>

      <form onSubmit={handleCreate} className="fc-card" style={{ padding: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--fc-text-secondary)', flex: '1 1 160px' }}>
          Identificador (ex.: agencia-viana)
          <input className="fc-input" required value={id} onChange={(e) => setId(e.target.value)} placeholder="id-curto" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--fc-text-secondary)', flex: '2 1 260px' }}>
          Nome
          <input className="fc-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da filial" />
        </label>
        <button type="submit" disabled={busy} className="fc-btn fc-btn--primary">
          {busy ? 'A criar…' : 'Criar filial'}
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
        ) : branches.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13.5, color: 'var(--fc-text-secondary)' }}>Ainda sem filiais.</div>
        ) : (
          branches.map((b) => (
            <div
              key={b.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--fc-border)' }}
            >
              <Link to={`/instituicoes/${institutionId}/${b.id}`} style={{ fontWeight: 700, color: 'var(--fc-text-primary)', textDecoration: 'none' }}>
                {b.name} <span style={{ fontWeight: 500, color: 'var(--fc-text-secondary)', fontSize: 12.5 }}>({b.id})</span>
              </Link>
              <button className="fc-btn fc-btn--secondary" style={{ color: 'var(--fc-danger)' }} onClick={() => handleDelete(b)}>
                Remover
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
