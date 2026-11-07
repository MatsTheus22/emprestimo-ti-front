import {
  getLoansControllerListMineQueryKey,
  getEquipmentControllerListQueryKey,
  type MyLoansDtoOutput,
  useLoansControllerListMine,
} from '../api/generated';
import { retryUnlessDenied } from '../api/retry';

// PRD: no máximo 3 itens ao mesmo tempo. A API é quem garante; aqui é o que a tela mostra.
export const LIMITE_EMPRESTIMOS = 3;

export type MyLoans = MyLoansDtoOutput;

// Por ter no máximo 3 itens em aberto, a primeira página sempre traz todos.
export function useMyLoans() {
  return useLoansControllerListMine(undefined, {
    query: { select: (response) => response.data as MyLoans, retry: retryUnlessDenied },
  });
}

// O que muda quando um empréstimo é criado ou recusado.
export const CONSULTAS_DE_EMPRESTIMO = [
  getEquipmentControllerListQueryKey(),
  getLoansControllerListMineQueryKey(),
];
