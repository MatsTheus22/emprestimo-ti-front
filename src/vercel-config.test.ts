import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Spec 002 CA-08: recarregar uma rota interna (ex.: /catalogo) na Vercel
// precisa devolver o index.html da SPA, não 404. Arquivos reais de dist/
// (assets) têm prioridade sobre o rewrite.

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
  outputDirectory?: string;
  rewrites?: { source: string; destination: string }[];
};

describe('vercel.json (front)', () => {
  it('test_ca_08_toda_rota_da_spa_cai_no_index_html', () => {
    expect(config.outputDirectory).toBe('dist');
    expect(config.rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }]);
  });
});
