import type { EquipmentListDtoOutputItemsItem, MyLoansDtoOutputTotals } from '../api/generated';
import type { StatusTone } from '../app/StatusPill';
import { formatDate } from '../app/format-date';
import { LIMITE_EMPRESTIMOS } from '../loans/use-my-loans';

export type CatalogItem = EquipmentListDtoOutputItemsItem;

export interface CardState {
  statusLabel: string;
  tone: StatusTone;
  detail: string;
  action: { label: string; enabled: boolean };
}

// Por que a pessoa não pode solicitar agora, e o rótulo que o botão mostra (layout.md §7).
export type Bloqueio = 'Bloqueado por atraso' | `Limite de ${number} itens`;

export const CATEGORY_LABEL: Record<CatalogItem['category'], string> = {
  notebook: 'Notebook',
  monitor: 'Monitor',
  cabo: 'Cabo',
  camera: 'Câmera',
};

// Com atraso e limite ao mesmo tempo, vale o atraso, que tem banner e atalho.
export function bloqueioDe(totals: MyLoansDtoOutputTotals | undefined): Bloqueio | null {
  if (!totals) return null;
  if (totals.overdue > 0) return 'Bloqueado por atraso';
  if (totals.open >= LIMITE_EMPRESTIMOS) return `Limite de ${LIMITE_EMPRESTIMOS} itens`;
  return null;
}

// layout.md §5.2 e §7. Item com outra pessoa mostra só a situação, sem nome nem data.
export function cardState(item: CatalogItem, bloqueio: Bloqueio | null): CardState {
  if (item.status === 'manutencao') {
    return {
      statusLabel: 'Em manutenção',
      tone: 'muted',
      detail: 'Indisponível durante a manutenção',
      action: { label: 'Indisponível', enabled: false },
    };
  }
  if (item.status === 'emprestado') {
    return item.myLoan
      ? {
          statusLabel: 'Emprestado',
          tone: 'warn',
          detail: `Com você · devolver até ${formatDate(item.myLoan.dueAt)}`,
          action: { label: 'Está com você', enabled: false },
        }
      : {
          statusLabel: 'Emprestado',
          tone: 'warn',
          detail: '',
          action: { label: 'Emprestado', enabled: false },
        };
  }
  return {
    statusLabel: 'Disponível',
    tone: 'ok',
    detail: 'Pronto para retirada no balcão',
    action: bloqueio ? { label: bloqueio, enabled: false } : { label: 'Solicitar', enabled: true },
  };
}
