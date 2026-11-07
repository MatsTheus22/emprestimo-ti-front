// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureHttp } from '../api/http';
import { dueDatePreview } from '../app/format-date';
import { configureImages } from '../catalog/image-url';
import { CatalogPage } from './CatalogPage';

// Spec 004 CA-13: solicitar pela tela, e quem foi recusado vê o motivo.

const ID_DISPONIVEL = '00000000-0000-4000-8000-000000000001';
const DISPONIVEL = {
  id: ID_DISPONIVEL,
  assetTag: 'TI-0001',
  name: 'Notebook 14 polegadas',
  category: 'notebook',
  status: 'disponivel',
  imagePath: 'TI-0001.jpg',
  myLoan: null,
};
const MANUTENCAO = {
  ...DISPONIVEL,
  id: '00000000-0000-4000-8000-000000000002',
  assetTag: 'TI-0004',
  status: 'manutencao',
};
const DEVOLUCAO = '2031-03-11T02:59:59.999Z'; // 10/03/2031 em São Paulo

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>();

interface Estado {
  itens: object[];
  meus: { open: number; overdue: number };
  aoSolicitar: () => Response;
}
let estado: Estado;

function problema(status: number, type: string, detail = 'texto que a tela não deve usar') {
  return new Response(JSON.stringify({ type, title: 'Conflict', status, detail, instance: '/x' }), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

function criado() {
  estado.itens = [{ ...DISPONIVEL, status: 'emprestado', myLoan: { dueAt: DEVOLUCAO } }];
  estado.meus = { open: 1, overdue: 0 };
  return new Response(
    JSON.stringify({
      id: '00000000-0000-4000-8000-0000000000aa',
      equipment: { id: ID_DISPONIVEL, assetTag: 'TI-0001', name: 'Notebook', category: 'notebook' },
      borrowedAt: '2031-02-24T15:00:00.000Z',
      dueAt: DEVOLUCAO,
    }),
    { status: 201 },
  );
}

function chamadas(metodo: string, sufixo: string) {
  return fetchMock.mock.calls.filter(
    ([url, init]) => url.endsWith(sufixo) && (init?.method ?? 'GET') === metodo,
  );
}

function abrir() {
  configureHttp({ baseUrl: 'http://api.test/v1', getAccessToken: () => Promise.resolve('tok') });
  configureImages({ supabaseUrl: 'https://projeto.supabase.test' });
  const router = createMemoryRouter([
    { path: '/', element: <CatalogPage /> },
    { path: '/meus-emprestimos', element: <p>Tela de meus empréstimos</p> },
  ]);
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

function botaoSolicitar() {
  return screen.findByRole<HTMLButtonElement>('button', { name: 'Solicitar' });
}

async function abrirModal() {
  abrir();
  const usuario = userEvent.setup();
  await usuario.click(await botaoSolicitar());
  return { usuario, modal: await screen.findByRole('dialog') };
}

beforeEach(() => {
  estado = { itens: [DISPONIVEL], meus: { open: 0, overdue: 0 }, aoSolicitar: criado };
  fetchMock.mockImplementation((url, init) => {
    if (init?.method === 'POST') return Promise.resolve(estado.aoSolicitar());
    if (url.includes('/v1/loans/me')) {
      return Promise.resolve(
        Response.json({ items: [], nextCursor: null, totals: estado.meus }),
      );
    }
    return Promise.resolve(
      Response.json({
        items: estado.itens,
        nextCursor: null,
        totals: { total: estado.itens.length, available: 1 },
      }),
    );
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('solicitar', () => {
  it('test_ca_13_modal_mostra_o_item_e_a_devolucao_prevista', async () => {
    const { modal } = await abrirModal();
    const noModal = within(modal);

    expect(noModal.getByRole('heading', { name: 'Solicitar empréstimo' })).toBeTruthy();
    expect(noModal.getByText('Notebook 14 polegadas · TI-0001')).toBeTruthy();
    expect(noModal.getByText(dueDatePreview(new Date()))).toBeTruthy();
    expect(chamadas('POST', '/v1/loans')).toHaveLength(0);
  });

  it('test_ca_13_confirmar_envia_o_equipamento_e_mostra_toast_com_a_data_da_api', async () => {
    const { usuario, modal } = await abrirModal();

    await usuario.click(within(modal).getByRole('button', { name: 'Confirmar' }));

    const toast = await screen.findByRole('status');
    expect(toast.textContent).toBe('Empréstimo criado. Devolver até 10/03/2031.');
    expect(screen.queryByRole('dialog')).toBeNull();
    const [, init] = chamadas('POST', '/v1/loans')[0] ?? [];
    expect(JSON.parse(init?.body as string)).toEqual({ equipmentId: ID_DISPONIVEL });
    expect(new Headers(init?.headers).get('Content-Type')).toContain('application/json');
  });

  it('test_ca_13_depois_de_criar_o_catalogo_e_os_totais_sao_atualizados', async () => {
    const { usuario, modal } = await abrirModal();

    await usuario.click(within(modal).getByRole('button', { name: 'Confirmar' }));

    const botao = await screen.findByRole<HTMLButtonElement>('button', { name: 'Está com você' });
    expect(botao.disabled).toBe(true);
    expect(screen.getByText('Com você · devolver até 10/03/2031')).toBeTruthy();
    expect(chamadas('GET', '/v1/equipment').length).toBeGreaterThanOrEqual(2);
    expect(chamadas('GET', '/v1/loans/me').length).toBeGreaterThanOrEqual(2);
  });

  it('test_ca_13_toast_sai_sozinho_depois_de_2600_ms', async () => {
    const { usuario, modal } = await abrirModal();
    await usuario.click(within(modal).getByRole('button', { name: 'Confirmar' }));
    await screen.findByRole('status');

    await waitFor(() => expect(screen.queryByRole('status')).toBeNull(), { timeout: 4_000 });
  });

  it('test_ca_13_duplo_clique_em_confirmar_envia_um_pedido_so', async () => {
    let liberar: (resposta: Response) => void = () => undefined;
    const { usuario, modal } = await abrirModal();
    const original = fetchMock.getMockImplementation();
    fetchMock.mockImplementation((url, init) =>
      init?.method === 'POST'
        ? new Promise<Response>((resolve) => {
            liberar = resolve;
          })
        : (original as NonNullable<typeof original>)(url, init),
    );

    const confirmar = within(modal).getByRole<HTMLButtonElement>('button', { name: 'Confirmar' });
    await usuario.click(confirmar);
    await waitFor(() => expect(chamadas('POST', '/v1/loans')).toHaveLength(1));
    expect(confirmar.disabled).toBe(true);
    await usuario.click(confirmar);

    expect(chamadas('POST', '/v1/loans')).toHaveLength(1);
    liberar(criado());
    await screen.findByRole('status');
  });

  it('test_ca_13_cancelar_fecha_sem_pedir_nada', async () => {
    const { usuario, modal } = await abrirModal();

    await usuario.click(within(modal).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(chamadas('POST', '/v1/loans')).toHaveLength(0);
  });

  it('test_ca_13_clique_fora_fecha_e_clique_dentro_nao', async () => {
    const { usuario, modal } = await abrirModal();

    await usuario.click(within(modal).getByText('Solicitar empréstimo'));
    expect(screen.getByRole('dialog')).toBeTruthy();

    await usuario.click(modal.parentElement as HTMLElement);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('test_ca_13_esc_fecha_o_modal', async () => {
    const { usuario } = await abrirModal();

    await usuario.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('motivo visível antes de tentar', () => {
  it('test_ca_13_com_3_em_aberto_o_botao_mostra_limite_de_3_itens', async () => {
    estado.meus = { open: 3, overdue: 0 };
    abrir();

    const botao = await screen.findByRole<HTMLButtonElement>('button', {
      name: 'Limite de 3 itens',
    });
    expect(botao.disabled).toBe(true);
    expect(botao.classList.contains('btn-secondary')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Solicitar' })).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('test_ca_13_com_2_em_aberto_ainda_solicita', async () => {
    estado.meus = { open: 2, overdue: 0 };
    abrir();
    await screen.findByRole('article', { name: /TI-0001/ });

    const botao = await botaoSolicitar();
    await waitFor(() => expect(chamadas('GET', '/v1/loans/me').length).toBeGreaterThan(0));
    expect(botao.disabled).toBe(false);
  });

  it('test_ca_13_com_atraso_o_botao_mostra_bloqueado_e_aparece_o_banner', async () => {
    estado.meus = { open: 1, overdue: 1 };
    abrir();

    const botao = await screen.findByRole<HTMLButtonElement>('button', {
      name: 'Bloqueado por atraso',
    });
    expect(botao.disabled).toBe(true);
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Você tem empréstimo em atraso',
    );
  });

  it('test_ca_13_banner_de_atraso_leva_a_meus_emprestimos', async () => {
    estado.meus = { open: 1, overdue: 1 };
    const router = abrir();

    await userEvent
      .setup()
      .click(await screen.findByRole('link', { name: 'Ver meus empréstimos' }));

    expect(await screen.findByText('Tela de meus empréstimos')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/meus-emprestimos');
  });

  it('test_ca_13_com_atraso_e_limite_vale_o_motivo_do_atraso', async () => {
    estado.meus = { open: 3, overdue: 1 };
    abrir();

    expect(await screen.findByRole('button', { name: 'Bloqueado por atraso' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Limite de 3 itens' })).toBeNull();
  });

  it('test_ca_13_bloqueio_nao_troca_o_botao_de_item_em_manutencao', async () => {
    estado.itens = [DISPONIVEL, MANUTENCAO];
    estado.meus = { open: 3, overdue: 0 };
    abrir();

    await screen.findByRole('button', { name: 'Limite de 3 itens' });
    expect(screen.getByRole('button', { name: 'Indisponível' })).toBeTruthy();
  });
});

describe('recusa da API depois de abrir o modal', () => {
  it.each([
    ['urn:emprestai:erro:equipamento-indisponivel', 'Este equipamento não está mais disponível.'],
    ['urn:emprestai:erro:limite-emprestimos', 'Você já tem 3 empréstimos em aberto.'],
    [
      'urn:emprestai:erro:emprestimo-em-atraso',
      'Você tem empréstimo em atraso e não pode solicitar outro.',
    ],
  ])('test_ca_13_mostra_o_motivo_pelo_type_%s', async (tipo, motivo) => {
    estado.aoSolicitar = () => problema(409, tipo);
    const { usuario, modal } = await abrirModal();

    await usuario.click(within(modal).getByRole('button', { name: 'Confirmar' }));

    expect((await within(modal).findByRole('alert')).textContent).toBe(motivo);
    expect(screen.queryByRole('status')).toBeNull();
    expect(within(modal).queryByRole('button', { name: 'Confirmar' })).toBeNull();
  });

  it('test_ca_13_recusa_atualiza_o_catalogo_e_os_totais', async () => {
    estado.aoSolicitar = () => {
      estado.itens = [{ ...DISPONIVEL, status: 'emprestado' }];
      return problema(409, 'urn:emprestai:erro:equipamento-indisponivel');
    };
    const { usuario, modal } = await abrirModal();

    await usuario.click(within(modal).getByRole('button', { name: 'Confirmar' }));
    await within(modal).findByRole('alert');
    await usuario.click(within(modal).getByRole('button', { name: 'Fechar' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(await screen.findByRole('button', { name: 'Emprestado' })).toBeTruthy();
    expect(chamadas('GET', '/v1/loans/me').length).toBeGreaterThanOrEqual(2);
  });

  it('test_ca_13_erro_inesperado_permite_tentar_de_novo', async () => {
    estado.aoSolicitar = () => problema(500, 'about:blank');
    const { usuario, modal } = await abrirModal();

    await usuario.click(within(modal).getByRole('button', { name: 'Confirmar' }));

    expect((await within(modal).findByRole('alert')).textContent).toBe(
      'Não foi possível solicitar agora. Tente de novo.',
    );

    estado.aoSolicitar = criado;
    await usuario.click(within(modal).getByRole('button', { name: 'Confirmar' }));

    expect((await screen.findByRole('status')).textContent).toContain('10/03/2031');
  });
});

describe('previsão da devolução', () => {
  it.each([
    // Meio-dia em São Paulo.
    ['2026-11-06T15:00:00.000Z', '20/11/2026'],
    // 22h em São Paulo: em UTC já é o dia seguinte, mas o "hoje" ainda é dia 6.
    ['2026-11-07T01:00:00.000Z', '20/11/2026'],
    // Meia-noite em São Paulo: agora é dia 7.
    ['2026-11-07T03:00:00.000Z', '21/11/2026'],
    // Atravessa a virada do ano.
    ['2026-12-25T12:00:00.000Z', '08/01/2027'],
  ])('test_ca_13_hoje_mais_14_em_sao_paulo_para_%s', (instante, esperado) => {
    expect(dueDatePreview(new Date(instante))).toBe(esperado);
  });
});
