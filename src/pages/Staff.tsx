import { useEffect, useState, type FormEvent } from 'react';
import { assignStaff, listAccessProfiles, listAllStaff, listBranches, listInstitutions, removeStaff, setStaffProfile } from '../lib/admin';
import { FieldLabel } from './SidePanel';
import type { AccessProfile, Branch, Institution, StaffMember, StaffRole } from '../types';

export function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
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
      const [s, i, p] = await Promise.all([listAllStaff(), listInstitutions(), listAccessProfiles()]);
      setStaff(s);
      setInstitutions(i);
      setProfiles(p);
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

  async function handleProfileChange(member: StaffMember, profileId: string) {
    setError(null);
    try {
      await setStaffProfile(member.id, profileId || null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atribuir o perfil.');
    }
  }

  return (
    <>
      <div className="fc-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
          A conta de login (email/palavra-passe) tem de já existir no Dashboard do Supabase (Authentication → Add User) --
          aqui só se associa essa conta a uma instituição/filial/perfil operacional.
        </div>
        <form onSubmit={handleAssign} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 220px' }}>
            <FieldLabel>Email da conta já criada</FieldLabel>
            <input type="email" className="fc-input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@exemplo.test" />
          </div>
          <div style={{ flex: '2 1 200px' }}>
            <FieldLabel>Nome</FieldLabel>
            <input className="fc-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <FieldLabel>Perfil operacional</FieldLabel>
            <select className="fc-input" value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
              <option value="agent">Agente</option>
              <option value="manager">Gestor</option>
            </select>
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <FieldLabel>Instituição</FieldLabel>
            <select className="fc-input" required value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
              <option value="">— escolher —</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <FieldLabel>Filial</FieldLabel>
            <select className="fc-input" required value={branchId} onChange={(e) => setBranchId(e.target.value)} disabled={branches.length === 0}>
              <option value="">— escolher —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={busy} className="fc-btn fc-btn--primary">
            {busy ? 'A atribuir…' : 'Atribuir'}
          </button>
        </form>
      </div>

      {error && (
        <div className="fc-card" style={{ background: 'var(--red-bg)', padding: '12px 16px', fontSize: 13.5, color: 'var(--red)' }}>{error}</div>
      )}

      <div className="fc-card" style={{ overflow: 'hidden' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ background: 'var(--surface-alt)' }}>
              {['Nome', 'Email', 'Perfil operacional', 'Instituição', 'Filial', 'Perfil de acesso', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.03em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 24, fontSize: 13.5, color: 'var(--text-muted)' }}>A carregar…</td></tr>
            ) : staff.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 24, fontSize: 13.5, color: 'var(--text-muted)' }}>Ainda sem colaboradores.</td></tr>
            ) : (
              staff.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 20px', fontWeight: 600, fontSize: 13.5 }}>{s.name}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-secondary)', fontSize: 13 }}>{s.email}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span className="fc-pill" style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)' }}>
                      {s.role === 'manager' ? 'Gestor' : 'Agente'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-secondary)', fontSize: 13 }}>{s.institutionId}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-secondary)', fontSize: 13 }}>{s.branchId}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <select className="fc-input" style={{ fontSize: 12.5, padding: '6px 8px' }} value={s.accessProfileId ?? ''} onChange={(e) => handleProfileChange(s, e.target.value)}>
                      <option value="">— nenhum —</option>
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <button className="fc-btn fc-btn--outline" style={{ color: 'var(--red)', fontSize: 12 }} onClick={() => handleRemove(s)}>
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
