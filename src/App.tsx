import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AuthContext, type AuthGateway } from './auth/auth';
import { createRoutes } from './app/routes';

export function App({ auth }: { auth: AuthGateway }) {
  const [queryClient] = useState(() => new QueryClient());
  const [router] = useState(() => createBrowserRouter(createRoutes(auth)));

  return (
    <AuthContext value={auth}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthContext>
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
