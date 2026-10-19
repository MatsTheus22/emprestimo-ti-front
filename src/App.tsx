import type { Env } from './config/env';

// Página temporária da fundação; a tela de Login entra na L12.
export function App({ env }: { env: Env }) {
  return (
    <main style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <h1>EMPREST.AI</h1>
      <p>Front de pé. API em {env.VITE_API_BASE_URL}</p>
    </main>
  );
}

// Subida com configuração inválida: diz qual variável corrigir.
export function EnvErrorScreen({ variables }: { variables: string[] }) {
  return (
    <main role="alert" style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Configuração inválida</h1>
      <p>Corrija no .env (veja .env.example):</p>
      <ul>
        {variables.map((name) => (
          <li key={name}>
            <code>{name}</code>
          </li>
        ))}
      </ul>
    </main>
  );
}
