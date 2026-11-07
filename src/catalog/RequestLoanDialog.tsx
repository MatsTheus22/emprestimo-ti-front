import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { type LoanDtoOutput, useLoansControllerCreate } from '../api/generated';
import { ApiError } from '../api/http';
import { dueDatePreview } from '../app/format-date';
import { CONSULTAS_DE_EMPRESTIMO } from '../loans/use-my-loans';
import type { CatalogItem } from './card-state';

// ADR-001 §4: a tela decide pelo `type` do Problem Details, nunca lendo a mensagem da API.
const MOTIVO_POR_TIPO: Record<string, string> = {
  'urn:emprestai:erro:equipamento-indisponivel': 'Este equipamento não está mais disponível.',
  'urn:emprestai:erro:limite-emprestimos': 'Você já tem 3 empréstimos em aberto.',
  'urn:emprestai:erro:emprestimo-em-atraso':
    'Você tem empréstimo em atraso e não pode solicitar outro.',
};

const FALHA = 'Não foi possível solicitar agora. Tente de novo.';

function motivoDaRecusa(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status === 404) return MOTIVO_POR_TIPO['urn:emprestai:erro:equipamento-indisponivel'] ?? null;
  return MOTIVO_POR_TIPO[error.problem?.type ?? ''] ?? null;
}

// layout.md §5.6 e §7.1. O empréstimo é criado ao confirmar, sem aprovação.
export function RequestLoanDialog({
  item,
  onClose,
  onCreated,
}: {
  item: CatalogItem;
  onClose: () => void;
  onCreated: (loan: LoanDtoOutput) => void;
}) {
  const queryClient = useQueryClient();
  const pedido = useLoansControllerCreate({
    mutation: {
      onSuccess: (response) => onCreated(response.data as LoanDtoOutput),
      // Criado ou recusado, o catálogo e os totais podem ter mudado.
      onSettled: () =>
        Promise.all(
          CONSULTAS_DE_EMPRESTIMO.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        ),
    },
  });

  const motivo = motivoDaRecusa(pedido.error);
  const fechar = () => {
    if (!pedido.isPending) onClose();
  };

  useEffect(() => {
    const aoApertar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') fechar();
    };
    document.addEventListener('keydown', aoApertar);
    return () => document.removeEventListener('keydown', aoApertar);
  });

  return (
    <div className="dialog-backdrop" onClick={fechar}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-solicitar"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id="titulo-solicitar" className="dialog-title">
          Solicitar empréstimo
        </h2>
        <p className="dialog-body">O empréstimo é criado ao confirmar. A retirada é no balcão.</p>

        <dl
          style={{
            display: 'grid',
            gap: 8,
            margin: 0,
            padding: '14px 16px',
            border: '1px solid var(--color-divider)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <LinhaDoResumo rotulo="Equipamento" valor={`${item.name} · ${item.assetTag}`} />
          <LinhaDoResumo rotulo="Devolver até" valor={dueDatePreview(new Date())} />
        </dl>

        {pedido.isError && (
          <p role="alert" style={{ fontSize: 13, color: 'var(--status-error-fg)' }}>
            {motivo ?? FALHA}
          </p>
        )}

        <div className="dialog-actions">
          {motivo ? (
            // Recusa de negócio: tentar de novo não muda o resultado.
            <button type="button" className="btn btn-secondary" autoFocus onClick={onClose}>
              Fechar
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={pedido.isPending}
                onClick={fechar}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                autoFocus
                disabled={pedido.isPending}
                onClick={() => pedido.mutate({ data: { equipmentId: item.id } })}
              >
                Confirmar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LinhaDoResumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 13.5 }}>
      <dt style={{ color: 'var(--color-text-55)' }}>{rotulo}</dt>
      <dd style={{ margin: 0, color: 'var(--color-accent-300)', textAlign: 'right' }}>{valor}</dd>
    </div>
  );
}
