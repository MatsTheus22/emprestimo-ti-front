import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureHttp } from './api/http';
import { App, EnvErrorScreen } from './App';
import { createSupabaseAuth } from './auth/auth';
import { InvalidEnvError, loadEnv } from './config/env';
import './styles/nocturne.css';

const root = createRoot(document.getElementById('root') as HTMLElement);

try {
  const env = loadEnv(import.meta.env);
  const auth = createSupabaseAuth(env);
  configureHttp({ baseUrl: env.VITE_API_BASE_URL, getAccessToken: () => auth.getAccessToken() });

  root.render(
    <StrictMode>
      <App auth={auth} />
    </StrictMode>,
  );
} catch (error) {
  if (!(error instanceof InvalidEnvError)) throw error;
  console.error(error.message);
  root.render(<EnvErrorScreen variables={error.variables} />);
}
