import type { Env } from './config/env';

// Página temporária da fundação; a tela de Login entra na L12.
export function App({ env }: { env: Env }) {
  return (
    <main style={{ padding: '36px 40px 64px', display: 'grid', gap: 12 }}>
      <span className="nav-brand">
        <span className="brand-mark" aria-hidden />
        <span>
          EMPREST<span style={{ color: 'var(--color-accent)' }}>.AI</span>
        </span>
      </span>
      <p style={{ color: 'var(--color-text-55)' }}>Front de pé. API em {env.VITE_API_BASE_URL}</p>
    </main>
  );
}

// Subida com configuração inválida: diz qual variável corrigir.
export function EnvErrorScreen({ variables }: { variables: string[] }) {
  return (
    <main role="alert" style={{ padding: '36px 40px', display: 'grid', gap: 12 }}>
      <h1 style={{ fontSize: 30 }}>Configuração inválida</h1>
      <p style={{ color: 'var(--color-text-62)' }}>Corrija no .env (veja .env.example):</p>
      <ul style={{ margin: 0, color: 'var(--status-error-fg)' }}>
        {variables.map((name) => (
          <li key={name}>
            <code>{name}</code>
          </li>
        ))}
      </ul>
    </main>
  );
}
