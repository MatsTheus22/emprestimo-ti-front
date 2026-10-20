import { defineConfig } from 'orval';

// ADR-001 §2/§4: cliente da API gerado do openapi.json, nunca escrito à mão.
// Hooks do TanStack Query; o transporte é src/api/http.ts (token + Problem Details).
export default defineConfig({
  api: {
    input: './openapi.json',
    output: {
      target: './src/api/generated.ts',
      client: 'react-query',
      httpClient: 'fetch',
      override: {
        mutator: { path: './src/api/http.ts', name: 'apiFetch' },
      },
    },
  },
});
