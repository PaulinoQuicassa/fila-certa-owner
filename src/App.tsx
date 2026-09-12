import { useState } from 'react';
import * as Sentry from '@sentry/react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Login } from './pages/Login';
import { MfaEnroll } from './pages/MfaEnroll';
import { MfaChallenge } from './pages/MfaChallenge';
import { Layout, type TabId } from './pages/Layout';
import { Institutions } from './pages/Institutions';
import { AccessProfiles } from './pages/AccessProfiles';
import { Staff } from './pages/Staff';
import { Owners } from './pages/Owners';

function CrashFallback() {
  return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>Ocorreu um erro inesperado.</h2>
      <p>A equipa técnica já foi notificada. Recarregue a página para continuar.</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '10px 20px' }}>
        Recarregar
      </button>
    </div>
  );
}

function OwnerConsole() {
  const [tab, setTab] = useState<TabId>('empresas');

  return (
    <Layout tab={tab} onTabChange={setTab}>
      {tab === 'empresas' && <Institutions />}
      {tab === 'perfis' && <AccessProfiles />}
      {tab === 'colaboradores' && <Staff />}
      {tab === 'donos' && <Owners />}
    </Layout>
  );
}

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={<CrashFallback />}>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </Sentry.ErrorBoundary>
  );
}

function Gate() {
  const { user, profile, loading, mfaState } = useAuth();
  if (loading) return null;
  if (!user || !profile) return <Login />;
  // MFA obrigatório (Fase 6) -- nenhum destes dois ecrãs pode ser
  // saltado para chegar à consola; 'checking' também bloqueia
  // (evita mostrar a consola por uma fracção de segundo antes de
  // sabermos o estado real de MFA desta sessão).
  if (mfaState === 'checking') return null;
  if (mfaState === 'enroll-required') return <MfaEnroll />;
  if (mfaState === 'challenge-required') return <MfaChallenge />;
  return <OwnerConsole />;
}
