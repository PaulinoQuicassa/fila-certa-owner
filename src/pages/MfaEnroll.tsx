import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../auth/AuthContext';
import { reportError } from '../sentry';

// Ecrã bloqueante -- Fase 6: "MFA obrigatório para o dono". Aparece
// sempre que a conta nunca teve um factor TOTP verificado; não existe
// nenhum botão de "saltar" -- só "Sair" (abandona o login, não entra
// na consola sem inscrever).
export function MfaEnroll() {
  const { logout, refreshMfaState } = useAuth();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function enroll() {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (cancelled) return;
      if (enrollError || !data) {
        reportError(enrollError ?? new Error('mfa-enroll-no-data'), { flow: 'owner_mfa_enroll_init' });
        setLoadError('Não foi possível iniciar a verificação em dois passos. Recarregue a página.');
        return;
      }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    }
    enroll();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setBusy(true);
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
      if (verifyError) {
        setError('Código inválido ou expirado. Confirma a hora do telemóvel e tenta novamente.');
        return;
      }
      await refreshMfaState();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="fc-card" style={{ width: 420, padding: 36, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--brand-blue)' }}>
            Configurar autenticação de dois factores
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            Obrigatório para contas de dono da plataforma. Usa uma app como Google
            Authenticator, Authy ou 1Password para ler o código.
          </div>
        </div>

        {loadError && <div style={{ fontSize: 13, color: 'var(--red)' }}>{loadError}</div>}

        {qrCode && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <img src={qrCode} alt="Código QR para configurar MFA" style={{ width: 200, height: 200 }} />
            {secret && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                Não consegues ler o código? Insere esta chave manualmente:
                <div style={{ fontFamily: 'monospace', fontSize: 13, marginTop: 4, wordBreak: 'break-all' }}>{secret}</div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Código de 6 dígitos
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              className="fc-input"
              disabled={!factorId}
            />
          </label>

          {error && <div style={{ fontSize: 13, color: 'var(--red)' }}>{error}</div>}

          <button type="submit" disabled={busy || !factorId || code.length !== 6} className="fc-btn fc-btn--primary" style={{ width: '100%', padding: 12, fontSize: 14 }}>
            {busy ? 'A confirmar…' : 'Confirmar e activar'}
          </button>
          <button type="button" onClick={logout} className="fc-btn" style={{ width: '100%', padding: 10, fontSize: 13 }}>
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
