import { useEffect, useMemo, useState } from 'react';
import { deleteInstitution, listInstitutionsOverview } from '../lib/admin';
import { CompanyFormPanel } from './CompanyFormPanel';
import { BranchesPanel } from './BranchesPanel';
import type { BillingStatus, InstitutionOverview } from '../types';

function fmtKz(n: number) {
  return Math.round(n).toLocaleString('pt-PT') + ' Kz';
}

const STATUS_LABEL: Record<BillingStatus, string> = { active: 'Activo', trial: 'Trial', suspended: 'Suspenso' };
const STATUS_COLOR: Record<BillingStatus, string> = { active: 'var(--green)', trial: 'var(--amber)', suspended: 'var(--red)' };
const STATUS_BG: Record<BillingStatus, string> = { active: 'var(--green-bg)', trial: 'var(--amber-bg)', suspended: 'var(--red-bg)' };

const FILTERS: { id: 'todas' | BillingStatus; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'active', label: 'Activas' },
  { id: 'trial', label: 'Trial' },
  { id: 'suspended', label: 'Suspensas' },
];

export function Institutions() {
  const [companies, setCompanies] = useState<InstitutionOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todas' | BillingStatus>('todas');
  const [panel, setPanel] = useState<{ kind: 'nova' } | { kind: 'editar'; company: InstitutionOverview } | { kind: 'balcoes'; company: InstitutionOverview } | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setCompanies(await listInstitutionsOverview());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = filter === 'todas' ? companies : companies.filter((c) => c.billingStatus === filter);

  const kpi = useMemo(() => {
    const active = companies.filter((c) => c.billingStatus === 'active');
    return {
      empresasAtivas: active.length,
      empresasTotal: companies.length,
      balcoesAtivos: active.reduce((sum, c) => sum + c.counterCount, 0),
      mrr: active.reduce((sum, c) => sum + c.mrrKz, 0),
      suspensas: companies.filter((c) => c.billingStatus === 'suspended').length,
    };
  }, [companies]);

  async function handleRemove(company: InstitutionOverview) {
    setError(null);
    try {
      await deleteInstitution(company.id);
      setConfirmRemoveId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover.');
      setConfirmRemoveId(null);
    }
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 20 }}>
        <div className="fc-card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10 }}>Empresas activas</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 29, fontWeight: 700 }}>{kpi.empresasAtivas}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>de {kpi.empresasTotal} registadas</div>
        </div>
        <div className="fc-card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10 }}>Balcões activos (facturados)</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 29, fontWeight: 700 }}>{kpi.balcoesAtivos}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>é a unidade vendida por mês</div>
        </div>
        <div className="fc-card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10 }}>Receita mensal recorrente</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 29, fontWeight: 700 }}>{fmtKz(kpi.mrr)}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>balcões activos × preço/balcão</div>
        </div>
        <div className="fc-card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10 }}>Empresas suspensas</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 29, fontWeight: 700, color: kpi.suspensas > 0 ? 'var(--red)' : 'var(--text-primary)' }}>{kpi.suspensas}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>pagamento em atraso</div>
        </div>
      </div>

      {error && (
        <div className="fc-card" style={{ background: 'var(--red-bg)', padding: '12px 16px', fontSize: 13.5, color: 'var(--red)' }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`fc-pill fc-pill--toggle${filter === f.id ? ' active' : ''}`}
                  style={{ padding: '6px 14px', fontSize: 12.5 }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={() => setPanel({ kind: 'nova' })} className="fc-btn fc-btn--primary">+ Nova empresa</button>
          </div>

          <div className="fc-card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 1fr 1.1fr 0.9fr 1.6fr', gap: 8, padding: '12px 20px', background: 'var(--surface-alt)', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.03em' }}>
              <div>Empresa</div><div>Tipo</div><div>Filiais</div><div>Balcões</div><div>Preço/balcão</div><div>Receita mensal</div><div>Estado</div><div>Acções</div>
            </div>
            {loading ? (
              <div style={{ padding: 24, fontSize: 13.5, color: 'var(--text-muted)' }}>A carregar…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 24, fontSize: 13.5, color: 'var(--text-muted)' }}>Nenhuma empresa aqui.</div>
            ) : (
              filtered.map((c) => (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 1fr 1.1fr 0.9fr 1.6fr', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--border)', alignItems: 'center' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
                  <div><span className="fc-pill" style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)' }}>{c.type ?? '—'}</span></div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.branchCount}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.counterCount}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{fmtKz(c.pricePerCounterKz)}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.billingStatus === 'active' ? fmtKz(c.mrrKz) : '—'}</div>
                  <div>
                    <span className="fc-pill" style={{ background: STATUS_BG[c.billingStatus], color: STATUS_COLOR[c.billingStatus] }}>{STATUS_LABEL[c.billingStatus]}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {confirmRemoveId === c.id ? (
                      <>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Remover?</span>
                        <button onClick={() => handleRemove(c)} className="fc-btn fc-btn--danger" style={{ padding: '5px 11px' }}>Sim</button>
                        <button onClick={() => setConfirmRemoveId(null)} className="fc-btn fc-btn--outline" style={{ padding: '5px 11px' }}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setPanel({ kind: 'editar', company: c })} className="fc-btn fc-btn--outline" style={{ padding: '6px 12px', fontSize: 12 }}>Editar</button>
                        <button onClick={() => setPanel({ kind: 'balcoes', company: c })} className="fc-btn fc-btn--secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Gerir balcões</button>
                        <button onClick={() => setConfirmRemoveId(c.id)} className="fc-btn fc-btn--outline" style={{ width: 30, height: 30, padding: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D8434F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {panel?.kind === 'nova' && (
          <CompanyFormPanel existing={null} onClose={() => setPanel(null)} onSaved={() => { setPanel(null); refresh(); }} />
        )}
        {panel?.kind === 'editar' && (
          <CompanyFormPanel existing={panel.company} onClose={() => setPanel(null)} onSaved={() => { setPanel(null); refresh(); }} />
        )}
        {panel?.kind === 'balcoes' && (
          <BranchesPanel institutionId={panel.company.id} institutionName={panel.company.name} onClose={() => { setPanel(null); refresh(); }} />
        )}
      </div>
    </>
  );
}
