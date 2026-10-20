import { describe, expect, it } from 'vitest';
import { InvalidEnvError, loadEnv } from './env';

// Spec 001 CA-11: variável VITE_* ausente ou inválida falha nomeando a variável.

const valid = {
  VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
  VITE_SUPABASE_ANON_KEY: 'anon-key-de-teste',
  VITE_API_BASE_URL: 'http://localhost:3000/v1',
  VITE_SENTRY_DSN: '',
};

describe('loadEnv', () => {
  it('test_ca_11_env_valida_carrega', () => {
    expect(loadEnv(valid)).toEqual(valid);
  });

  it('test_ca_11_variavel_ausente_falha_nomeando_a_variavel', () => {
    const { VITE_API_BASE_URL: _ausente, ...semApi } = valid;

    expect(() => loadEnv(semApi)).toThrow(InvalidEnvError);
    expect(() => loadEnv(semApi)).toThrow(/VITE_API_BASE_URL/);
  });

  it('test_ca_11_variaveis_invalidas_sao_todas_listadas', () => {
    try {
      loadEnv({ ...valid, VITE_SUPABASE_URL: 'nao-e-url', VITE_SUPABASE_ANON_KEY: '' });
      expect.unreachable();
    } catch (error) {
      expect((error as InvalidEnvError).variables).toEqual([
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
      ]);
    }
  });
});
