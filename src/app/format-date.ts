// O prazo é contado no calendário de São Paulo (spec 004): a data da tela não pode
// depender do fuso de quem abre.
const DATA = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' });

export function formatDate(iso: string): string {
  return DATA.format(new Date(iso));
}
