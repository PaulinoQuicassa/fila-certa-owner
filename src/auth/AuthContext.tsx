import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { reportError } from '../sentry';
import type { OwnerProfile } from '../types';

// Estado de MFA da sessão actual -- Fase 6 do hardening ("MFA
// obrigatório para o dono, mecanismo real via Supabase Auth"). Nunca
// um segundo factor local/inventado: usa TOTP nativo
// (`supabase.auth.mfa`) e o "aal" (Authenticator Assurance Level) real
// do próprio JWT da sessão.
//   'checking'           -- ainda a determinar (evita um "flash" da consola antes de saber)
//   'enroll-required'    -- a conta NUNCA teve um factor TOTP verificado -- inscrição obrigatória, sem forma de saltar
//   'challenge-required' -- já tem um factor verificado, mas esta sessão ainda está em aal1 -- pede o código antes de mostrar seja o que for
//   'satisfied'          -- aal2 confirmado nesta sessão
export type MfaState = 'checking' | 'enroll-required' | 'challenge-required' | 'satisfied';

interface AuthState {
  user: User | null;
  profile: OwnerProfile | null;
  loading: boolean;
  mfaState: MfaState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Chamado pelos ecrãs de MFA depois de um enroll/challenge ter
   * sucesso -- reavalia o aal real da sessão em vez de assumir. */
  refreshMfaState: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// Um "dono" nunca está na tabela `staff` (essa exige institution_id/
// branch_id -- um dono não tem âmbito de filial nenhum, vê e gere tudo).
// A pertença real é a linha em `owners`, mas RLS só deixa cada um ler a
// própria (owners_select_self) -- suficiente aqui, só queremos saber se
// o utilizador que acabou de entrar é dono. Esta leitura funciona em
// aal1 (a policy não exige is_owner()/aal2) -- é o que permite decidir
// "é dono, mas ainda não passou o MFA" em vez de "não é dono".
async function fetchOwnerProfile(uid: string): Promise<OwnerProfile | null> {
  const { data, error } = await supabase.from('owners').select('id, name').eq('id', uid).maybeSingle();
  if (error || !data) return null;
  return { uid: data.id, name: data.name };
}

async function computeMfaState(): Promise<MfaState> {
  const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError) throw factorsError;
  const hasVerifiedTotp = (factorsData?.totp ?? []).some((f) => f.status === 'verified');
  if (!hasVerifiedTotp) return 'enroll-required';

  const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalError) throw aalError;
  return aalData.currentLevel === aalData.nextLevel ? 'satisfied' : 'challenge-required';
}

// Revalidação periódica (Fase 6: "revalidação periódica da sessão/
// papel/permissões") -- um dono removido a meio de uma sessão activa
// (por outro dono, noutro separador/dispositivo) deixa de ter linha em
// `owners`; sem isto, a consola continuaria aberta com dados já
// desactualizados até o utilizador refrescar a página por acaso.
const REVALIDATION_INTERVAL_MS = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [mfaState, setMfaState] = useState<MfaState>('checking');
  const [loading, setLoading] = useState(true);
  const revalidatingRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function applySession(u: User | null) {
      setUser(u);
      if (u) {
        try {
          const [p, mfa] = await Promise.all([fetchOwnerProfile(u.id), computeMfaState()]);
          if (active) {
            setProfile(p);
            setMfaState(mfa);
          }
        } catch (err) {
          // Antes disto, uma falha aqui (rede, RPC da Auth em baixo)
          // ficava por resolver para sempre -- `loading` nunca voltava
          // a `false` e a consola mostrava um ecrã em branco
          // indefinidamente, sem nenhum registo do que aconteceu.
          reportError(err, { flow: 'owner_session_bootstrap' });
          if (active) {
            setProfile(null);
            setMfaState('checking');
          }
        }
      } else if (active) {
        setProfile(null);
        setMfaState('checking');
      }
      if (active) setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => applySession(data.session?.user ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user ?? null);
    });

    async function revalidate() {
      if (revalidatingRef.current || document.hidden) return;
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;
      if (!currentUser) return; // onAuthStateChange já trata do logout
      revalidatingRef.current = true;
      try {
        const p = await fetchOwnerProfile(currentUser.id);
        if (!active) return;
        if (!p) {
          // Acesso de dono foi removido entretanto -- limpa tudo e
          // força de volta ao ecrã de login, nunca deixa a consola
          // aberta com autorização já perdida.
          await supabase.auth.signOut();
          return;
        }
        setProfile(p);
      } finally {
        revalidatingRef.current = false;
      }
    }

    const intervalId = window.setInterval(revalidate, REVALIDATION_INTERVAL_MS);
    document.addEventListener('visibilitychange', revalidate);

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', revalidate);
    };
  }, []);

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      // Nunca o email/password -- só a classificação do erro, para
      // detectar um pico de falhas de login sem guardar quem tentou.
      reportError(error ?? new Error('login-failed'), { flow: 'owner_login', authErrorCode: error?.code });
      throw error ?? new Error('login-failed');
    }
    const p = await fetchOwnerProfile(data.user.id);
    if (!p) {
      await supabase.auth.signOut();
      throw new Error('not-owner');
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function refreshMfaState() {
    const mfa = await computeMfaState();
    setMfaState(mfa);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, mfaState, login, logout, refreshMfaState }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
