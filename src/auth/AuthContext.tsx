import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import type { OwnerProfile } from '../types';

interface AuthState {
  user: User | null;
  profile: OwnerProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// Um "dono" nunca está na tabela `staff` (essa exige institution_id/
// branch_id -- um dono não tem âmbito de filial nenhum, vê e gere tudo).
// A pertença real é a linha em `owners`, mas RLS só deixa cada um ler a
// própria (owners_select_self) -- suficiente aqui, só queremos saber se
// o utilizador que acabou de entrar é dono.
async function fetchOwnerProfile(uid: string): Promise<OwnerProfile | null> {
  const { data, error } = await supabase.from('owners').select('id, name').eq('id', uid).maybeSingle();
  if (error || !data) return null;
  return { uid: data.id, name: data.name };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function applySession(u: User | null) {
      setUser(u);
      if (u) {
        const p = await fetchOwnerProfile(u.id);
        if (active) setProfile(p);
      } else if (active) {
        setProfile(null);
      }
      if (active) setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => applySession(data.session?.user ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw error ?? new Error('login-failed');
    const p = await fetchOwnerProfile(data.user.id);
    if (!p) {
      await supabase.auth.signOut();
      throw new Error('not-owner');
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
