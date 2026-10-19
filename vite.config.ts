/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// ADR-001 §8: Vitest usa o mesmo pipeline do Vite.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true }, // CORS_ORIGIN do back aponta para cá
  test: { environment: 'node' },
});
