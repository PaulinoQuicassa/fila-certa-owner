import { createClient } from '@supabase/supabase-js';

// Mesmo projecto Supabase partilhado pelas outras duas apps (fila-certa-staff,
// projectogestaodefilas). A "publishable key" não é secreta -- o controlo de
// acesso vive inteiramente nas RPCs "security definer" restritas a
// is_owner() (ver supabase/migrations no repo fila-certa-staff).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY em falta (ver .env.example).');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
