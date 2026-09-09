import { useEffect, useState, type FormEvent } from 'react';
import { assignStaff, listAllStaff, listBranches, listInstitutions, removeStaff } from '../lib/admin';
import type { Branch, Institution, StaffMember, StaffRole } from '../types';

export function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('agent');
  const [institutionId, setInstitutionId] = useState('');
  const [branchId, setBranchId] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const [s, i] = await Promise.all([listAllStaff(), listInstitutions()]);
      setStaff(s);
      setInstitutions(i);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!institutionId) {
      setBranches([]);
      setBranchId('');
      return;
    }
    listBranches(institutionId).then((b) => {
      setBranches(b);
      setBranchId(b[0]?.id ?? '');
    });
  }, [institutionId]);

  async function handleAssign(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await assignStaff(email.trim(), name.trim(), role, institutionId, branchId);
      setEmail('');
      setName('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atribuir o colaborador.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(member: StaffMember) {
    if (!confirm(`Remover o acesso de "${member.name}"? A conta de login não é apagada, só deixa de ter perfil de equipa.`)) return;
    setError(null);
    try {
      await removeStaff(member.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover.');
    }
  }

  return (
    <>
      <div style={{ fontSize: 22, fontWeight: 800 }}>Colaboradores</div>
      <div style={{ fontSize: 12.5, color: 'var(--fc-text-secondary)', marginTop: -12 }}>
        A conta de login (email/palavra-passe) tem de já existir no Dashboard do Supabase (Authentication → Add User) --
        aqui só se associa essa conta a uma instituição/filial/perfil.
      </div>

      <form onSubmit={handleAssign} className="fc-card" style={{ padding: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--fc-text-secondary)', flex: '2 1 220px' }}>
          Email da conta já criada
          <input type="email" className="fc-input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@exemplo.test" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--fc-text-secondary)', flex: '2 1 200px' }}>
          Nome
          <input className="fc-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--fc-text-secondary)', flex: '1 1 140px' }}>
          Perfil
          <select className="fc-input" value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
            <option value="agent">Agente</option>
            <option value="manager">Gestor</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--fc-text-secondary)', flex: '1 1 180px' }}>
          Instituição
          <select className="fc-input" required value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
            <option value="">— escolher —</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--fc-text-secondary)', flex: '1 1 180px' }}>
          Filial
          <select className="fc-input" required value={branchId} onChange={(e) => setBranchId(e.target.value)} disabled={branches.length === 0}>
            <option value="">— escolher —</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={busy} className="fc-btn fc-btn--primary">
          {busy ? 'A atribuir…' : 'Atribuir'}
        </button>
      </form>

      {error && (
        <div className="fc-card" style={{ background: 'var(--fc-danger-bg)', boxShadow: 'none', padding: '12px 16px', fontSize: 13.5, color: 'var(--fc-danger)' }}>
          {error}
        </div>
      )}

      <div className="fc-card" style={{ overflow: 'hidden' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid var(--fc-border)' }}>
              {['Nome', 'Email', 'Perfil', 'Instituição', 'Filial', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 14px', fontSize: 13, color: 'var(--fc-text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 24, fontSize: 13.5, color: 'var(--fc-text-secondary)' }}>A carregar…</td></tr>
            ) : staff.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 24, fontSize: 13.5, color: 'var(--fc-text-secondary)' }}>Ainda sem colaboradores.</td></tr>
            ) : (
              staff.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--fc-border)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--fc-text-secondary)' }}>{s.email}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className="fc-pill" style={{ background: 'var(--fc-accent-light)', color: 'var(--fc-accent-dark)' }}>
                      {s.role === 'manager' ? 'Gestor' : 'Agente'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--fc-text-secondary)' }}>{s.institutionId}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--fc-text-secondary)' }}>{s.branchId}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button className="fc-btn fc-btn--secondary" style={{ color: 'var(--fc-danger)' }} onClick={() => handleRemove(s)}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
