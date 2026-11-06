import { useInfiniteQuery } from '@tanstack/react-query';
import {
  equipmentControllerList,
  type EquipmentListDtoOutput,
  getEquipmentControllerListQueryKey,
} from '../api/generated';
import { retryUnlessDenied } from '../api/retry';
import { StatusPill } from '../app/StatusPill';
import { CATEGORY_LABEL, type CatalogItem, cardState } from '../catalog/card-state';
import { equipmentImageUrl } from '../catalog/image-url';

// layout.md §5.2 · spec 004 CA-07. Busca e filtros ficam fora desta versão.
export function CatalogPage() {
  const catalogo = useInfiniteQuery({
    queryKey: getEquipmentControllerListQueryKey(),
    queryFn: async ({ pageParam }) => {
      const response = await equipmentControllerList(pageParam ? { cursor: pageParam } : undefined);
      return response.data as EquipmentListDtoOutput;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (ultima) => ultima.nextCursor,
    retry: retryUnlessDenied,
  });

  return (
    <main
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: '36px 40px 64px',
        display: 'grid',
        gap: 22,
      }}
    >
      <header style={{ display: 'grid', gap: 6 }}>
        <h1 style={{ fontSize: 30 }}>Catálogo</h1>
        {catalogo.data && <Contagem totals={catalogo.data.pages.at(-1)?.totals} />}
      </header>

      {catalogo.isPending && <p style={{ color: 'var(--color-text-55)' }}>Carregando…</p>}

      {catalogo.isError && (
        <div role="alert" style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
          <p style={{ color: 'var(--status-error-fg)' }}>Não foi possível carregar o catálogo.</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void catalogo.refetch()}
          >
            Tentar de novo
          </button>
        </div>
      )}

      {catalogo.data && <Grade itens={catalogo.data.pages.flatMap((pagina) => pagina.items)} />}

      {catalogo.hasNextPage && (
        <button
          type="button"
          className="btn btn-secondary"
          style={{ justifySelf: 'center' }}
          disabled={catalogo.isFetchingNextPage}
          onClick={() => void catalogo.fetchNextPage()}
        >
          Carregar mais
        </button>
      )}

      {/* Contrato da skill imagens-equipamentos: a tela que exibe as fotos dá o crédito. */}
      <p style={{ fontSize: 12, color: 'var(--color-text-40)' }}>
        Fotos:{' '}
        <a
          href="https://pixabay.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'inherit' }}
        >
          Pixabay
        </a>
      </p>
    </main>
  );
}

function Contagem({ totals }: { totals?: EquipmentListDtoOutput['totals'] }) {
  if (!totals) return null;
  return (
    <p style={{ fontSize: 14, color: 'var(--color-text-55)' }}>
      {totals.available} de {totals.total} equipamentos disponíveis agora
    </p>
  );
}

function Grade({ itens }: { itens: CatalogItem[] }) {
  if (itens.length === 0) {
    return <p style={{ color: 'var(--color-text-55)' }}>Nenhum equipamento cadastrado.</p>;
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(292px, 1fr))',
        gap: 16,
      }}
    >
      {itens.map((item) => (
        <Card key={item.id} item={item} />
      ))}
    </div>
  );
}

function Card({ item }: { item: CatalogItem }) {
  const { statusLabel, tone, detail, action } = cardState(item);

  return (
    <article
      className="card"
      aria-label={`${item.name} ${item.assetTag}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        animation: 'fadeUp .25s ease both',
      }}
    >
      <Foto item={item} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'grid', gap: 2 }}>
          <span className="card-kicker">{CATEGORY_LABEL[item.category]}</span>
          <h2 className="card-title">{item.name}</h2>
          <span style={{ fontSize: 12, color: 'var(--color-text-45)' }}>{item.assetTag}</span>
        </div>
        <div>
          <StatusPill tone={tone}>{statusLabel}</StatusPill>
        </div>
      </div>
      <p style={{ minHeight: 18, fontSize: 13, color: 'var(--color-text-55)' }}>{detail}</p>
      <button
        type="button"
        className={`btn ${action.enabled ? 'btn-primary' : 'btn-secondary'} btn-block`}
        style={{ marginTop: 'auto' }}
        disabled={!action.enabled}
      >
        {action.label}
      </button>
    </article>
  );
}

const FOTO = {
  display: 'block',
  width: '100%',
  aspectRatio: '4 / 3',
  borderRadius: 'var(--radius-md)',
} as const;

function Foto({ item }: { item: CatalogItem }) {
  if (!item.imagePath) {
    return (
      <div
        role="img"
        aria-label="Sem foto"
        style={{ ...FOTO, background: 'color-mix(in srgb, var(--color-text) 5%, transparent)' }}
      />
    );
  }
  return (
    <img
      src={equipmentImageUrl(item.imagePath)}
      alt={item.name}
      width={800}
      height={600}
      loading="lazy"
      style={{ ...FOTO, height: 'auto', objectFit: 'cover' }}
    />
  );
}
