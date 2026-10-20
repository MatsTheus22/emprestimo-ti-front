import { z } from 'zod';

// Mesmo princípio do back (ADR-001 §9): variável ausente ou inválida
// falha na subida, nomeando a variável, em vez de virar `undefined`.
// Só chaves públicas aqui — este código roda no navegador (rules/secrets.md).
const envSchema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_API_BASE_URL: z.url(),
  VITE_SENTRY_DSN: z.union([z.url(), z.literal('')]).optional(),
});

export type Env = z.infer<typeof envSchema>;

export class InvalidEnvError extends Error {
  override readonly name = 'InvalidEnvError';
  readonly variables: string[];

  constructor(variables: string[]) {
    super(`Variáveis de ambiente inválidas: ${variables.join(', ')}`);
    this.variables = variables;
  }
}

export function loadEnv(source: Record<string, unknown>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new InvalidEnvError(result.error.issues.map((issue) => issue.path.join('.')));
  }
  return result.data;
}
