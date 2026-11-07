// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureHttp } from '../api/http';
import { MyLoansPage } from './MyLoansPage';

// Spec 004 CA-16: a tela "Meus empréstimos", com a API respondendo como a real.

function emprestimo(sobre: object = {}) {
  return {
    id: '00000000-0000-4000-8000-0000000000a1',
    equipment: {
      id: '00000000-0000-4000-8000-000000000001',
      assetTag: 'TI-0001',
      name: 'Notebook 14 polegadas',
      category: 'notebook',
    },
    // 23h do dia 24/02 em São Paulo: em UTC já é dia 25.
    borrowedAt: '2031-02-25T02:00:00.000Z',
    // Fim do dia 10/03 em São Paulo: em UTC já é dia 11.
    dueAt: '2031-03-11T02:59:59.999Z',
    overdue: false,
    ...sobre,
  };
}

const ATRASADO = emprestimo({
  id: '00000000-0000-4000-8000-0000000000a2',
  equipment: {
    id: '00000000-0000-4000-8000-000000000002',
    assetTag: 'TI-0005',
    name: 'Monitor 24 polegadas',
    category: 'monitor',
  },
  dueAt: '2020-01-16T02:59:59.999Z',
  overdue: true,
});

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>();

function responderCom(itens: object[], totals: { open: number; overdue: number }) {
  fetchMock.mockImplementation(() =>
    Promise.resolve(Response.json({ items: itens, nextCursor: null, totals })),
  );
}

function abrir() {
  configureHttp({ baseUrl: 'http://api.test/v1', getAccessToken: () => Promise.resolve('tok') });
  const router = createMemoryRouter([
    { path: '/', element: <MyLoansPage /> },
    { path: '/catalogo', element: <p>Tela do catálogo</p> },
  ]);
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

function tracos() {
  return within(screen.getByRole('img', { name: /itens em seu nome/ }))
    .getAllByTestId('traco')
    .map((traco) => traco.dataset.estado);
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('com empréstimos', () => {
  it('test_ca_16_cabecalho_mostra_quantos_de_3_e_o_prazo', async () => {
    responderCom([emprestimo(), ATRASADO], { open: 2, overdue: 1 });
    abrir();

    expect(await screen.findByRole('heading', { name: 'Meus empréstimos' })).toBeTruthy();
    expect(await screen.findByText('2 de 3 itens em seu nome · prazo padrão de 14 dias')).toBeTruthy();
  });

  it('test_ca_16_linha_mostra_item_retirada_e_devolucao_no_fuso_de_sao_paulo', async () => {
    responderCom([emprestimo()], { open: 1, overdue: 0 });
    abrir();

    const linha = within(await screen.findByRole('listitem', { name: /TI-0001/ }));

    expect(linha.getByText('Notebook 14 polegadas')).toBeTruthy();
    expect(linha.getByText('TI-0001')).toBeTruthy();
    expect(linha.getByText('24/02/2031')).toBeTruthy();
    expect(linha.getByText('10/03/2031')).toBeTruthy();
  });

  it('test_ca_16_pill_em_dia_e_em_atraso', async () => {
    responderCom([emprestimo(), ATRASADO], { open: 2, overdue: 1 });
    abrir();

    const emDia = within(await screen.findByRole('listitem', { name: /TI-0001/ }));
    const atrasado = within(screen.getByRole('listitem', { name: /TI-0005/ }));

    expect(emDia.getByText('Em dia')).toBeTruthy();
    expect(emDia.queryByText('Em atraso')).toBeNull();
    expect(atrasado.getByText('Em atraso')).toBeTruthy();
    expect(atrasado.queryByText('Em dia')).toBeNull();
    expect(atrasado.getByText('15/01/2020').style.color).toBe('var(--status-error-fg)');
    expect(emDia.getByText('10/03/2031').style.color).toBe('var(--status-ok-fg)');
  });

  it('test_ca_16_nao_tem_botao_devolver', async () => {
    responderCom([emprestimo(), ATRASADO], { open: 2, overdue: 1 });
    abrir();
    await screen.findByRole('listitem', { name: /TI-0001/ });

    expect(screen.queryByRole('button', { name: /devolver/i })).toBeNull();
  });

  it.each([
    [[emprestimo()], { open: 1, overdue: 0 }, ['ocupado', 'vazio', 'vazio']],
    [[emprestimo(), ATRASADO], { open: 2, overdue: 1 }, ['atraso', 'ocupado', 'vazio']],
    [
      [emprestimo(), emprestimo(), emprestimo()],
      { open: 3, overdue: 0 },
      ['ocupado', 'ocupado', 'ocupado'],
    ],
  ])('test_ca_16_barra_de_3_tracos_%#', async (itens, totals, esperado) => {
    responderCom(
      itens.map((item, indice) => ({ ...item, id: `00000000-0000-4000-8000-00000000000${indice}` })),
      totals,
    );
    abrir();
    await screen.findByText(/itens em seu nome ·/);

    expect(tracos()).toEqual(esperado);
  });

  it('test_ca_16_chama_a_api_so_com_o_token', async () => {
    responderCom([emprestimo()], { open: 1, overdue: 0 });
    abrir();
    await screen.findByRole('listitem', { name: /TI-0001/ });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('http://api.test/v1/loans/me');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer tok');
  });

  it('test_ca_16_mostra_as_regras_no_rodape', async () => {
    responderCom([emprestimo()], { open: 1, overdue: 0 });
    abrir();
    await screen.findByRole('listitem', { name: /TI-0001/ });

    expect(screen.getByText('Até 3 itens ao mesmo tempo')).toBeTruthy();
    expect(screen.getByText('Prazo padrão de 14 dias')).toBeTruthy();
    expect(screen.getByText('Item em atraso impede novos pedidos')).toBeTruthy();
  });
});

describe('sem empréstimos', () => {
  it('test_ca_16_mostra_o_estado_vazio_e_a_barra_vazia', async () => {
    responderCom([], { open: 0, overdue: 0 });
    abrir();

    expect(await screen.findByText('Você não tem empréstimos em aberto.')).toBeTruthy();
    expect(screen.getByText('0 de 3 itens em seu nome · prazo padrão de 14 dias')).toBeTruthy();
    expect(tracos()).toEqual(['vazio', 'vazio', 'vazio']);
    expect(screen.queryByRole('listitem', { name: /TI-/ })).toBeNull();
  });

  it('test_ca_16_ir_ao_catalogo_leva_para_o_catalogo', async () => {
    responderCom([], { open: 0, overdue: 0 });
    const router = abrir();

    await userEvent.setup().click(await screen.findByRole('link', { name: 'Ir ao catálogo' }));

    expect(await screen.findByText('Tela do catálogo')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/catalogo');
  });
});

describe('falha', () => {
  it('test_ca_16_erro_da_api_mostra_mensagem_e_tentar_de_novo', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ type: 'about:blank', title: 'Error', status: 500 }), {
          status: 500,
        }),
      ),
    );
    abrir();

    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('Não foi possível carregar seus empréstimos.');

    responderCom([emprestimo()], { open: 1, overdue: 0 });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByRole('listitem', { name: /TI-0001/ })).toBeTruthy();
  });
});
