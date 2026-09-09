import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Login } from './pages/Login';
import { Layout } from './pages/Layout';
import { Institutions } from './pages/Institutions';
import { Branches } from './pages/Branches';
import { Counters } from './pages/Counters';
import { Staff } from './pages/Staff';
import { Owners } from './pages/Owners';

function RequireOwner({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) return null;
  if (!user || !profile) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function LoginRoute() {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (user && profile) return <Navigate to="/" replace />;
  return <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/" element={<RequireOwner><Institutions /></RequireOwner>} />
          <Route path="/instituicoes/:institutionId" element={<RequireOwner><Branches /></RequireOwner>} />
          <Route path="/instituicoes/:institutionId/:branchId" element={<RequireOwner><Counters /></RequireOwner>} />
          <Route path="/colaboradores" element={<RequireOwner><Staff /></RequireOwner>} />
          <Route path="/donos" element={<RequireOwner><Owners /></RequireOwner>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
