import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createCounter, deleteCounter, listCounters } from '../lib/admin';
import type { Counter } from '../types';

export function Counters() {
  const { institutionId = '', branchId = '' } = useParams<{ institutionId: string; branchId: string }>();
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setCounters(await listCounters(institutionId, branchId));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [institutionId, branchId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createCounter(institutionId, branchId, id.trim(), label.trim());
      setId('');
      setLabel('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o balcão.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(counter: Counter) {
    if (!confirm(`Remover "${counter.label}"? Só é possível se não tiver senhas associadas no histórico.`)) return;
    setError(null);
    try {
      await deleteCounter(institutionId, branchId, counter.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover.');
    }
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Link to={`/instituicoes/${institutionId}`} style={{ fontSize: 13, color: 'var(--fc-text-secondary)' }}>← Filiais</Link>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Balcões — {branchId}</div>
        <div style={{ fontSize: 12.5, color: 'var(--fc-text-secondary)' }}>
          Para escolher os serviços de cada balcão e atribuir o colaborador, use o dashboard do gestor dessa filial.
        </div>
      </div>

      <form onSubmit={handleCreate} className="fc-card" style={{ padding: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--fc-text-secondary)', flex: '1 1 160px' }}>
          Identificador (ex.: guiche-4)
          <input className="fc-input" required value={id} onChange={(e) => setId(e.target.value)} placeholder="id-curto" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--fc-text-secondary)', flex: '2 1 260px' }}>
          Rótulo
          <input className="fc-input" required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Balcão 4" />
        </label>
        <button type="submit" disabled={busy} className="fc-btn fc-btn--primary">
          {busy ? 'A criar…' : 'Criar balcão'}
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
        ) : counters.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13.5, color: 'var(--fc-text-secondary)' }}>Ainda sem balcões.</div>
        ) : (
          counters.map((c) => (
            <div
              key={c.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--fc-border)' }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{c.label} <span style={{ fontWeight: 500, color: 'var(--fc-text-secondary)', fontSize: 12.5 }}>({c.id})</span></div>
                <div style={{ fontSize: 12.5, color: 'var(--fc-text-secondary)' }}>
                  {c.services === null || c.services.length === 0 ? 'Atende todos os serviços' : c.services.join(', ')}
                </div>
              </div>
              <button className="fc-btn fc-btn--secondary" style={{ color: 'var(--fc-danger)' }} onClick={() => handleDelete(c)}>
                Remover
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
