import { useState, type FormEvent } from 'react';
import { createInstitution, updateInstitution } from '../lib/admin';
import { FieldLabel, PillSelect, SidePanel } from './SidePanel';
import { INSTITUTION_TYPES, type BillingStatus, type InstitutionOverview } from '../types';

const BILLING_STATUS_OPTIONS: { id: BillingStatus; label: string }[] = [
  { id: 'trial', label: 'Trial' },
  { id: 'active', label: 'Activo' },
  { id: 'suspended', label: 'Suspenso' },
];

export function CompanyFormPanel({ existing, onClose, onSaved }: { existing: InstitutionOverview | null; onClose: () => void; onSaved: () => void }) {
  const [id, setId] = useState(existing?.id ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [nif, setNif] = useState(existing?.nif ?? '');
  const [type, setType] = useState<string>(existing?.type ?? INSTITUTION_TYPES[0]);
  const [pricePerCounter, setPricePerCounter] = useState(existing?.pricePerCounterKz ?? 45000);
  const [billingStatus, setBillingStatus] = useState<BillingStatus>(existing?.billingStatus ?? 'trial');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (existing) {
        await updateInstitution(existing.id, name.trim(), nif.trim(), type, pricePerCounter, billingStatus);
      } else {
        await createInstitution(id.trim(), name.trim(), nif.trim(), type, pricePerCounter);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível guardar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SidePanel title={existing ? 'Editar empresa' : 'Nova empresa'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!existing && (
          <div>
            <FieldLabel>Identificador (ex.: bfa)</FieldLabel>
            <input className="fc-input" required value={id} onChange={(e) => setId(e.target.value)} placeholder="id-curto" />
          </div>
        )}

        <div>
          <FieldLabel>Nome da empresa</FieldLabel>
          <input className="fc-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Banco XPTO" />
        </div>

        <div>
          <FieldLabel>NIF</FieldLabel>
          <input className="fc-input" value={nif} onChange={(e) => setNif(e.target.value)} placeholder="000000000LA000" />
        </div>

        <div>
          <FieldLabel>Tipo de instituição</FieldLabel>
          <PillSelect options={INSTITUTION_TYPES} value={type as (typeof INSTITUTION_TYPES)[number]} onChange={setType} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-alt)', padding: '10px 12px', borderRadius: 9 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Preço por balcão / mês</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>é a unidade cobrada por mês</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={() => setPricePerCounter((v) => Math.max(0, v - 5000))} className="fc-btn fc-btn--outline" style={{ width: 26, height: 26, padding: 0 }}>–</button>
            <div style={{ fontSize: 13, fontWeight: 700, width: 88, textAlign: 'center' }}>{pricePerCounter.toLocaleString('pt-PT')} Kz</div>
            <button type="button" onClick={() => setPricePerCounter((v) => v + 5000)} className="fc-btn fc-btn--outline" style={{ width: 26, height: 26, padding: 0 }}>+</button>
          </div>
        </div>

        {existing && (
          <div>
            <FieldLabel>Estado</FieldLabel>
            <PillSelect options={BILLING_STATUS_OPTIONS.map((o) => o.label) as unknown as readonly string[]} value={BILLING_STATUS_OPTIONS.find((o) => o.id === billingStatus)!.label} onChange={(label) => setBillingStatus(BILLING_STATUS_OPTIONS.find((o) => o.label === label)!.id)} />
          </div>
        )}

        {error && <div style={{ fontSize: 13, color: 'var(--red)' }}>{error}</div>}

        <button type="submit" disabled={busy} className="fc-btn fc-btn--primary" style={{ width: '100%', padding: 11 }}>
          {busy ? 'A guardar…' : existing ? 'Guardar alterações' : 'Criar empresa'}
        </button>
      </form>
    </SidePanel>
  );
}
