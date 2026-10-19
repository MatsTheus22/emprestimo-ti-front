import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App, EnvErrorScreen } from './App';
import { InvalidEnvError, loadEnv } from './config/env';
import './styles/nocturne.css';

const root = createRoot(document.getElementById('root') as HTMLElement);

try {
  const env = loadEnv(import.meta.env);
  root.render(
    <StrictMode>
      <App env={env} />
    </StrictMode>,
  );
} catch (error) {
  if (!(error instanceof InvalidEnvError)) throw error;
  console.error(error.message);
  root.render(<EnvErrorScreen variables={error.variables} />);
}
