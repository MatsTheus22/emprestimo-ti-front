import type { EquipmentListDtoOutputItemsItem } from '../api/generated';
import type { StatusTone } from '../app/StatusPill';
import { formatDate } from '../app/format-date';

export type CatalogItem = EquipmentListDtoOutputItemsItem;

export interface CardState {
  statusLabel: string;
  tone: StatusTone;
  detail: string;
  action: { label: string; enabled: boolean };
}

export const CATEGORY_LABEL: Record<CatalogItem['category'], string> = {
  notebook: 'Notebook',
  monitor: 'Monitor',
  cabo: 'Cabo',
  camera: 'Câmera',
};

// layout.md §5.2 e §7. Item com outra pessoa mostra só a situação, sem nome nem data.
export function cardState(item: CatalogItem): CardState {
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
    action: { label: 'Solicitar', enabled: true },
  };
}
