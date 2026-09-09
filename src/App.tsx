import { useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Login } from './pages/Login';
import { Layout, type TabId } from './pages/Layout';
import { Institutions } from './pages/Institutions';
import { AccessProfiles } from './pages/AccessProfiles';
import { Staff } from './pages/Staff';
import { Owners } from './pages/Owners';

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
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

function Gate() {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (!user || !profile) return <Login />;
  return <OwnerConsole />;
}
