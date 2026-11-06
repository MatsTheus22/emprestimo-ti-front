import { Link } from 'react-router';
import type { MyLoansDtoOutputItemsItem, MyLoansDtoOutputTotals } from '../api/generated';
import { formatDate } from '../app/format-date';
import { StatusPill } from '../app/StatusPill';
import { LIMITE_EMPRESTIMOS, useMyLoans } from '../loans/use-my-loans';

const REGRAS = [
  `Até ${LIMITE_EMPRESTIMOS} itens ao mesmo tempo`,
  'Prazo padrão de 14 dias',
  'Item em atraso impede novos pedidos',
];

// layout.md §5.3 · spec 004 CA-16. O botão "Devolver" fica para a spec de devolução.
export function MyLoansPage() {
  const meus = useMyLoans();

  return (
    <main
      style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: '36px 40px 64px',
        display: 'grid',
        gap: 22,
      }}
    >
      <header style={{ display: 'grid', gap: 6 }}>
        <h1 style={{ fontSize: 30 }}>Meus empréstimos</h1>
        {meus.data && (
          <p style={{ fontSize: 14, color: 'var(--color-text-55)' }}>
            {resumo(meus.data.totals)} · prazo padrão de 14 dias
          </p>
        )}
      </header>

      {meus.isPending && <p style={{ color: 'var(--color-text-55)' }}>Carregando…</p>}

      {meus.isError && (
        <div role="alert" style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
          <p style={{ color: 'var(--status-error-fg)' }}>
            Não foi possível carregar seus empréstimos.
          </p>
          <button type="button" className="btn btn-secondary" onClick={() => void meus.refetch()}>
            Tentar de novo
          </button>
        </div>
      )}

      {meus.data && (
        <>
          <BarraDoLimite totals={meus.data.totals} />
          {meus.data.items.length === 0 ? (
            <EstadoVazio />
          ) : (
            <ul style={{ display: 'grid', gap: 10, margin: 0, padding: 0, listStyle: 'none' }}>
              {meus.data.items.map((emprestimo) => (
                <Linha key={emprestimo.id} emprestimo={emprestimo} />
              ))}
            </ul>
          )}
          <ul
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px 24px',
              margin: 0,
              padding: 0,
              listStyle: 'none',
              fontSize: 12.5,
              color: 'var(--color-text-45)',
            }}
          >
            {REGRAS.map((regra) => (
              <li key={regra}>{regra}</li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

function resumo({ open }: MyLoansDtoOutputTotals): string {
  return `${open} de ${LIMITE_EMPRESTIMOS} itens em seu nome`;
}

const COR_DO_TRACO = {
  atraso: 'var(--status-error-fg)',
  ocupado: 'var(--color-accent)',
  vazio: 'color-mix(in srgb, var(--color-text) 12%, transparent)',
} as const;

function BarraDoLimite({ totals }: { totals: MyLoansDtoOutputTotals }) {
  const emDia = totals.open - totals.overdue;
  const tracos = Array.from({ length: LIMITE_EMPRESTIMOS }, (_, indice) => {
    if (indice < totals.overdue) return 'atraso';
    return indice < totals.overdue + emDia ? 'ocupado' : 'vazio';
  });

  return (
    <div role="img" aria-label={resumo(totals)} style={{ display: 'flex', gap: 6 }}>
      {tracos.map((estado, indice) => (
        <span
          key={indice}
          data-testid="traco"
          data-estado={estado}
          style={{ flex: 1, height: 5, borderRadius: 999, background: COR_DO_TRACO[estado] }}
        />
      ))}
    </div>
  );
}

function Linha({ emprestimo }: { emprestimo: MyLoansDtoOutputItemsItem }) {
  const { equipment, overdue } = emprestimo;
  const cor = overdue ? 'var(--status-error-fg)' : 'var(--status-ok-fg)';

  return (
    <li
      aria-label={`${equipment.name} ${equipment.assetTag}`}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 20,
        padding: '18px 20px',
        border: '1px solid var(--color-divider)',
        borderLeft: `3px solid ${cor}`,
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface)',
      }}
    >
      <div style={{ flex: '1.4 1 200px', display: 'grid', gap: 2 }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{equipment.name}</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-45)' }}>{equipment.assetTag}</span>
      </div>
      <Coluna rotulo="Retirada">
        <span>{formatDate(emprestimo.borrowedAt)}</span>
      </Coluna>
      <Coluna rotulo="Devolver até">
        <span style={{ color: cor }}>{formatDate(emprestimo.dueAt)}</span>
      </Coluna>
      <div style={{ flex: '0.9 1 90px' }}>
        <StatusPill tone={overdue ? 'error' : 'ok'}>{overdue ? 'Em atraso' : 'Em dia'}</StatusPill>
      </div>
    </li>
  );
}

function Coluna({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: '1 1 110px', display: 'grid', gap: 2, fontSize: 13.5 }}>
      <span className="card-kicker">{rotulo}</span>
      {children}
    </div>
  );
}

function EstadoVazio() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 14,
        justifyItems: 'center',
        padding: 48,
        border: '1px dashed var(--color-divider)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
      }}
    >
      <p style={{ color: 'var(--color-text-55)' }}>Você não tem empréstimos em aberto.</p>
      <Link to="/catalogo" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
        Ir ao catálogo
      </Link>
    </div>
  );
}
