import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  padding: '8px 16px',
  borderRadius: 999,
  fontSize: 13.5,
  fontWeight: 700,
  background: isActive ? 'var(--fc-accent-dark)' : 'transparent',
  color: isActive ? '#fff' : 'var(--fc-text-secondary)',
});

export function Layout({ children }: { children: ReactNode }) {
  const { profile, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        className="fc-card"
        style={{
          margin: 24, marginBottom: 0, padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--fc-accent-dark)' }}>Fila Certa</div>
            <div style={{ fontSize: 12, color: 'var(--fc-text-secondary)' }}>Consola do dono</div>
          </div>
          <nav style={{ display: 'flex', gap: 4, background: 'var(--fc-bg)', borderRadius: 999, padding: 4 }}>
            <NavLink to="/" end style={navLinkStyle}>Instituições</NavLink>
            <NavLink to="/colaboradores" style={navLinkStyle}>Colaboradores</NavLink>
            <NavLink to="/donos" style={navLinkStyle}>Donos</NavLink>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--fc-text-secondary)' }}>{profile?.name}</span>
          <button onClick={() => logout()} style={{ fontSize: 13, fontWeight: 600, color: 'var(--fc-text-secondary)' }}>
            Terminar sessão
          </button>
        </div>
      </div>
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</div>
    </div>
  );
}
