import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../auth/AuthContext';
import { reportError } from '../sentry';

// Pedido do código a cada novo login (Fase 6) -- a conta já tem um
// factor TOTP verificado (senão seria MfaEnroll), mas esta sessão
// ainda está em aal1. Sem isto, a password sozinha continuaria a
// bastar para entrar na consola.
export function MfaChallenge() {
  const { logout, refreshMfaState } = useAuth();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadFactor() {
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      const verified = data?.totp.find((f) => f.status === 'verified');
      if (listError || !verified) {
        reportError(listError ?? new Error('mfa-challenge-no-verified-factor'), { flow: 'owner_mfa_challenge_init' });
        setLoadError('Não foi possível carregar a verificação. Recarregue a página.');
        return;
      }
      setFactorId(verified.id);
    }
    loadFactor();
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
        setError('O código não está correcto. Tente novamente.');
        return;
      }
      await refreshMfaState();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <form onSubmit={handleSubmit} className="fc-card" style={{ width: 380, padding: 36, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--brand-blue)' }}>Código de verificação</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            Introduza o código de 6 dígitos da sua app de autenticação.
          </div>
        </div>

        {loadError && <div style={{ fontSize: 13, color: 'var(--red)' }}>{loadError}</div>}

        <label htmlFor="owner-mfa-code" style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          Código
          <input
            id="owner-mfa-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            autoComplete="one-time-code"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'owner-mfa-error' : undefined}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            className="fc-input"
            disabled={!factorId}
          />
        </label>

        {error && <div id="owner-mfa-error" role="alert" style={{ fontSize: 13, color: 'var(--red)' }}>{error}</div>}

        <button type="submit" disabled={busy || !factorId || code.length !== 6} className="fc-btn fc-btn--primary" style={{ width: '100%', padding: 12, fontSize: 14 }}>
          {busy ? 'A verificar…' : 'Confirmar'}
        </button>
        <button type="button" onClick={logout} className="fc-btn" style={{ width: '100%', padding: 10, fontSize: 13 }}>
          Sair
        </button>
      </form>
    </div>
  );
}
