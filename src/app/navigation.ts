import type { Me } from '../auth/use-me';

type Role = Me['role'];

export interface Tab {
  path: string;
  label: string;
}

// layout.md §6: abas por papel, na ordem do desenho.
const CATALOGO: Tab = { path: '/catalogo', label: 'Catálogo' };
const MEUS: Tab = { path: '/meus-emprestimos', label: 'Meus empréstimos' };
const OPERACOES: Tab = { path: '/operacoes', label: 'Operações' };
const EQUIPAMENTOS: Tab = { path: '/equipamentos', label: 'Equipamentos' };

export const TABS_BY_ROLE: Record<Role, Tab[]> = {
  colaborador: [CATALOGO, MEUS],
  operacoes: [CATALOGO, OPERACOES, EQUIPAMENTOS, MEUS],
};

// Spec 002 CA-07: Colaborador cai no Catálogo; Operações em Operações.
export const HOME_BY_ROLE: Record<Role, string> = {
  colaborador: CATALOGO.path,
  operacoes: OPERACOES.path,
};

export const ROLE_LABEL: Record<Role, string> = {
  colaborador: 'Colaborador',
  operacoes: 'Operações',
};

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}
