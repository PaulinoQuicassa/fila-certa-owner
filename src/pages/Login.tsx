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
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--fc-accent-dark)' }}>Fila Certa</div>
          <div style={{ fontSize: 14, color: 'var(--fc-text-secondary)', marginTop: 4 }}>Consola do dono</div>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--fc-text-secondary)' }}>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="fc-input"
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--fc-text-secondary)' }}>
          Palavra-passe
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="fc-input"
          />
        </label>

        {error && <div style={{ fontSize: 13, color: 'var(--fc-danger)' }}>{error}</div>}

        <button type="submit" disabled={busy} className="fc-btn fc-btn--primary">
          {busy ? 'A entrar…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
