// O prazo é contado no calendário de São Paulo (spec 004): a data da tela não pode
// depender do fuso de quem abre.
const DATA = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' });

export function formatDate(iso: string): string {
  return DATA.format(new Date(iso));
}

const PARTES_DA_DATA = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const PRAZO_DIAS = 14;

// Só para o resumo do modal, antes de confirmar: a data que vale é a da resposta da API.
export function dueDatePreview(agora: Date): string {
  const partes = Object.fromEntries(
    PARTES_DA_DATA.formatToParts(agora).map(({ type, value }) => [type, Number(value)]),
  ) as { year: number; month: number; day: number };
  const devolucao = new Date(Date.UTC(partes.year, partes.month - 1, partes.day + PRAZO_DIAS));
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(devolucao);
}
