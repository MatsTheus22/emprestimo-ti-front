import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Spec 001 CA-12: a folha do Nocturne usa exatamente os tokens do
// layout.md §1–3 e define as classes que as telas usam.

const css = readFileSync(new URL('./nocturne.css', import.meta.url), 'utf8');

function token(name: string): string | undefined {
  return new RegExp(`${name}:\\s*([^;]+);`).exec(css)?.[1]?.trim();
}

describe('nocturne.css', () => {
  it.each([
    ['--color-bg', '#161826'],
    ['--color-surface', '#232532'],
    ['--color-text', '#e9e9ed'],
    ['--color-accent-500', '#2fb8ac'],
    ['--color-accent-300', '#93e3da'],
    ['--color-accent-700', '#1d746d'],
    ['--color-accent-900', '#0f3733'],
    ['--status-error-fg', '#e88b8b'],
    ['--status-warn-fg', '#c9a25f'],
    ['--status-muted-fg', '#9aa0ad'],
    ['--radius-sm', '4px'],
    ['--radius-md', '8px'],
    ['--radius-lg', '14px'],
  ])('test_ca_12_token_%s_igual_ao_layout', (name, expected) => {
    expect(token(name)).toBe(expected);
  });

  it('test_ca_12_fonte_unica_raleway', () => {
    expect(token('--font-heading')).toMatch(/^'Raleway'/);
    expect(token('--font-body')).toMatch(/^'Raleway'/);
  });

  it('test_ca_12_nunca_preto_nem_branco_puros', () => {
    expect(css).not.toMatch(/#000(000)?\b|#fff(fff)?\b|\bblack\b|\bwhite\b/i);
  });

  it.each([
    '.btn',
    '.btn-primary',
    '.btn-secondary',
    '.btn-ghost',
    '.btn-block',
    '.field',
    '.input',
    '.tag',
    '.tag-outline',
    '.card',
    '.nav',
    '.nav-brand',
    '.nav-tab',
  ])('test_ca_12_define_a_classe_%s', (selector) => {
    expect(css).toMatch(new RegExp(`\\${selector}\\s*[{,:]`));
  });
});
