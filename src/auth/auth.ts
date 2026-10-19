import { createClient } from '@supabase/supabase-js';
import { createContext, useContext } from 'react';
import type { Env } from '../config/env';

// O que as telas precisam da autenticação. A implementação real usa o
// supabase-js (ADR-001 §7: sessão no header, renovação e persistência
// resolvidas por ele); os testes usam uma falsa.
export interface AuthGateway {
  getAccessToken(): Promise<string | null>;
  signIn(email: string, password: string): Promise<'ok' | 'invalid_credentials'>;
  signOut(): Promise<void>;
}

export function createSupabaseAuth(env: Env): AuthGateway {
  // Só a chave anônima vive no navegador (rules/secrets.md).
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  return {
    async getAccessToken() {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    },
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) return 'ok';
      // Spec 002: credencial errada nunca diz se foi o e-mail ou a senha.
      if (error.code === 'invalid_credentials' || error.status === 400) return 'invalid_credentials';
      throw error;
    },
    async signOut() {
      await supabase.auth.signOut();
    },
  };
}

export const AuthContext = createContext<AuthGateway | null>(null);

export function useAuth(): AuthGateway {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth fora do AuthContext');
  return auth;
}
