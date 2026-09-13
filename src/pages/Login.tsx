import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'not-owner'
          ? 'Esta conta não tem acesso à consola do dono.'
          : 'Email ou palavra-passe incorrectos.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <form
        onSubmit={handleSubmit}
        className="fc-card"
        style={{ width: 380, padding: 36, display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, color: 'var(--brand-blue)' }}>Fila Certa</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Owner</div>
        </div>

        <label htmlFor="owner-email" style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          Email
          <input
            id="owner-email"
            type="email"
            required
            autoComplete="username"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'owner-login-error' : undefined}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="fc-input"
          />
        </label>

        <label htmlFor="owner-password" style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          Palavra-passe
          <input
            id="owner-password"
            type="password"
            required
            autoComplete="current-password"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'owner-login-error' : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="fc-input"
          />
        </label>

        {error && <div id="owner-login-error" role="alert" style={{ fontSize: 13, color: 'var(--red)' }}>{error}</div>}

        <button type="submit" disabled={busy} className="fc-btn fc-btn--primary" style={{ width: '100%', padding: 12, fontSize: 14 }}>
          {busy ? 'A entrar…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
