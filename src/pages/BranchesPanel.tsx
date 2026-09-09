import { useEffect, useState, type FormEvent } from 'react';
import { createBranch, createCounter, deleteBranch, deleteCounter, listBranches, listCounters } from '../lib/admin';
import { FieldLabel, SidePanel } from './SidePanel';
import type { Branch, Counter } from '../types';

function CounterRow({ counter, onRemoved }: { counter: Counter; onRemoved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove() {
    if (!confirm(`Remover "${counter.label}"? Só é possível se não tiver senhas no histórico.`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteCounter(counter.institutionId, counter.branchId, counter.id);
      onRemoved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border)', borderRadius: 9, padding: '8px 10px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: counter.status === 'paused' ? 'var(--amber)' : 'var(--green)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>{counter.label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{counter.id}</div>
        </div>
        <button disabled={busy} onClick={handleRemove} className="fc-btn fc-btn--outline" style={{ width: 26, height: 26, padding: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D8434F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
        </button>
      </div>
      {error && <div style={{ fontSize: 11.5, color: 'var(--red)' }}>{error}</div>}
    </div>
  );
}

function BranchBlock({ branch, onChanged }: { branch: Branch; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(false);
  const [newId, setNewId] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function refreshCounters() {
    setLoading(true);
    try {
      setCounters(await listCounters(branch.institutionId, branch.id));
      setFetchError(null);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Não foi possível carregar os balcões.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) refreshCounters();
  }, [open]);

  async function handleAddCounter(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await createCounter(branch.institutionId, branch.id, newId.trim(), newLabel.trim());
      setNewId('');
      setNewLabel('');
      await refreshCounters();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível criar o balcão.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveBranch() {
    if (!confirm(`Remover a filial "${branch.name}"? Só é possível se não tiver balcões nem senhas associadas.`)) return;
    try {
      await deleteBranch(branch.institutionId, branch.id);
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível remover.');
    }
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface-alt)' }}>
        <button onClick={() => setOpen((v) => !v)} style={{ background: 'none', border: 'none', fontSize: 12.5, fontWeight: 700, flex: 1, textAlign: 'left' }}>
          {open ? '▾' : '▸'} {branch.name} <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>({branch.id})</span>
        </button>
        <button onClick={handleRemoveBranch} className="fc-btn fc-btn--outline" style={{ width: 26, height: 26, padding: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D8434F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
        </button>
      </div>
      {open && (
        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>A carregar…</div>
          ) : fetchError ? (
            <div style={{ fontSize: 12, color: 'var(--red)' }}>{fetchError}</div>
          ) : counters.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ainda sem balcões.</div>
          ) : (
            counters.map((c) => <CounterRow key={c.id} counter={c} onRemoved={refreshCounters} />)
          )}
          <form onSubmit={handleAddCounter} style={{ display: 'flex', gap: 6 }}>
            <input className="fc-input" placeholder="id" required value={newId} onChange={(e) => setNewId(e.target.value)} style={{ flex: '0 1 80px' }} />
            <input className="fc-input" placeholder="Rótulo (ex.: Balcão 4)" required value={newLabel} onChange={(e) => setNewLabel(e.target.value)} style={{ flex: 1 }} />
            <button type="submit" disabled={busy} className="fc-btn fc-btn--secondary">+</button>
          </form>
          {formError && <div style={{ fontSize: 11.5, color: 'var(--red)' }}>{formError}</div>}
        </div>
      )}
    </div>
  );
}

export function BranchesPanel({ institutionId, institutionName, onClose }: { institutionId: string; institutionName: string; onClose: () => void }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setBranches(await listBranches(institutionId));
      setFetchError(null);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Não foi possível carregar as filiais.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [institutionId]);

  async function handleAddBranch(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createBranch(institutionId, newId.trim(), newName.trim());
      setNewId('');
      setNewName('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a filial.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SidePanel title={`Balcões — ${institutionName}`} subtitle="Filiais e balcões desta empresa -- clique numa filial para ver/gerir os seus balcões." onClose={onClose}>
      <form onSubmit={handleAddBranch} style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <input className="fc-input" placeholder="id" required value={newId} onChange={(e) => setNewId(e.target.value)} style={{ flex: '0 1 90px' }} />
        <input className="fc-input" placeholder="Nome da filial" required value={newName} onChange={(e) => setNewName(e.target.value)} style={{ flex: 1 }} />
        <button type="submit" disabled={busy} className="fc-btn fc-btn--primary">+</button>
      </form>
      {error && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10 }}>{error}</div>}
      <div style={{ maxHeight: 440, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <FieldLabel>A carregar…</FieldLabel>
        ) : fetchError ? (
          <div style={{ fontSize: 12.5, color: 'var(--red)' }}>{fetchError}</div>
        ) : branches.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Ainda sem filiais.</div>
        ) : (
          branches.map((b) => <BranchBlock key={b.id} branch={b} onChanged={refresh} />)
        )}
      </div>
    </SidePanel>
  );
}
