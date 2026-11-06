// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureHttp } from '../api/http';
import { configureImages } from '../catalog/image-url';
import { CatalogPage } from './CatalogPage';

// Spec 004 CA-07: a tela Catálogo, com a API respondendo como a real.

const ITENS = {
  disponivel: {
    id: '00000000-0000-4000-8000-000000000001',
    assetTag: 'TI-0001',
    name: 'Notebook 14 polegadas',
    category: 'notebook',
    status: 'disponivel',
    imagePath: 'TI-0001.jpg',
    myLoan: null,
  },
  manutencao: {
    id: '00000000-0000-4000-8000-000000000002',
    assetTag: 'TI-0004',
    name: 'Notebook 15 polegadas',
    category: 'notebook',
    status: 'manutencao',
    imagePath: 'TI-0004.jpg',
    myLoan: null,
  },
  comOutraPessoa: {
    id: '00000000-0000-4000-8000-000000000003',
    assetTag: 'TI-0005',
    name: 'Monitor 24 polegadas',
    category: 'monitor',
    status: 'emprestado',
    imagePath: 'TI-0005.jpg',
    myLoan: null,
  },
  comigo: {
    id: '00000000-0000-4000-8000-000000000004',
    assetTag: 'TI-0012',
    name: 'Câmera compacta',
    category: 'camera',
    status: 'emprestado',
    imagePath: 'TI-0012.jpg',
    // Fim do dia 10/03 em São Paulo: em UTC já é dia 11.
    myLoan: { dueAt: '2031-03-11T02:59:59.999Z' },
  },
  semFoto: {
    id: '00000000-0000-4000-8000-000000000005',
    assetTag: 'TI-0008',
    name: 'Cabo HDMI 2 m',
    category: 'cabo',
    status: 'disponivel',
    imagePath: null,
    myLoan: null,
  },
};

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>();

function responderCom(corpo: unknown, status = 200) {
  fetchMock.mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(corpo), {
        status,
        headers: { 'Content-Type': status === 200 ? 'application/json' : 'application/problem+json' },
      }),
    ),
  );
}

function lista(itens: object[], extra: object = {}) {
  return { items: itens, nextCursor: null, totals: { total: itens.length, available: 1 }, ...extra };
}

function abrir() {
  configureHttp({ baseUrl: 'http://api.test/v1', getAccessToken: () => Promise.resolve('tok') });
  configureImages({ supabaseUrl: 'https://projeto.supabase.test' });
  const router = createMemoryRouter([{ path: '/', element: <CatalogPage /> }]);
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

async function card(patrimonio: string) {
  return within(await screen.findByRole('article', { name: new RegExp(patrimonio) }));
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('card do catálogo', () => {
  it('test_ca_07_mostra_foto_nome_categoria_patrimonio_e_situacao', async () => {
    responderCom(lista([ITENS.disponivel]));
    abrir();

    const noCard = await card('TI-0001');

    const foto = noCard.getByRole('img', { name: 'Notebook 14 polegadas' });
    expect(foto.getAttribute('src')).toBe(
      'https://projeto.supabase.test/storage/v1/object/public/equipamentos/TI-0001.jpg',
    );
    expect(noCard.getByRole('heading', { name: 'Notebook 14 polegadas' })).toBeTruthy();
    expect(noCard.getByText('Notebook')).toBeTruthy();
    expect(noCard.getByText('TI-0001')).toBeTruthy();
    expect(noCard.getByText('Disponível')).toBeTruthy();
  });

  it('test_ca_07_categoria_usa_o_rotulo_da_tela', async () => {
    responderCom(lista([ITENS.comigo]));
    abrir();

    expect((await card('TI-0012')).getByText('Câmera')).toBeTruthy();
  });

  it('test_ca_07_sem_imagem_mostra_bloco_no_lugar_da_foto', async () => {
    responderCom(lista([ITENS.semFoto]));
    abrir();

    const noCard = await card('TI-0008');

    expect(noCard.queryByRole('img', { name: 'Cabo HDMI 2 m' })).toBeNull();
    expect(noCard.getByRole('img', { name: 'Sem foto' })).toBeTruthy();
  });

  it('test_ca_07_disponivel_tem_detalhe_e_botao_solicitar', async () => {
    responderCom(lista([ITENS.disponivel]));
    abrir();

    const noCard = await card('TI-0001');

    expect(noCard.getByText('Pronto para retirada no balcão')).toBeTruthy();
    const botao = noCard.getByRole<HTMLButtonElement>('button', { name: 'Solicitar' });
    expect(botao.disabled).toBe(false);
    expect(botao.classList.contains('btn-primary')).toBe(true);
  });

  it('test_ca_07_manutencao_tem_texto_fixo_e_botao_indisponivel_desabilitado', async () => {
    responderCom(lista([ITENS.manutencao]));
    abrir();

    const noCard = await card('TI-0004');

    expect(noCard.getByText('Em manutenção')).toBeTruthy();
    expect(noCard.getByText('Indisponível durante a manutenção')).toBeTruthy();
    const botao = noCard.getByRole<HTMLButtonElement>('button', { name: 'Indisponível' });
    expect(botao.disabled).toBe(true);
  });

  it('test_ca_07_com_outra_pessoa_mostra_so_a_situacao_sem_nome_nem_data', async () => {
    responderCom(lista([ITENS.comOutraPessoa]));
    abrir();

    const artigo = await screen.findByRole('article', { name: /TI-0005/ });
    const noCard = within(artigo);

    expect(noCard.getAllByText('Emprestado')).toHaveLength(2); // pill e botão
    expect(noCard.getByRole<HTMLButtonElement>('button', { name: 'Emprestado' }).disabled).toBe(true);
    expect(artigo.textContent).not.toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(artigo.textContent).not.toMatch(/Com |devolver/i);
  });

  it('test_ca_07_com_a_propria_pessoa_mostra_a_data_no_fuso_de_sao_paulo', async () => {
    responderCom(lista([ITENS.comigo]));
    abrir();

    const noCard = await card('TI-0012');

    expect(noCard.getByText('Com você · devolver até 10/03/2031')).toBeTruthy();
    expect(noCard.getByRole<HTMLButtonElement>('button', { name: 'Está com você' }).disabled).toBe(
      true,
    );
  });
});

describe('tela do catálogo', () => {
  it('test_ca_07_cabecalho_mostra_a_contagem_de_disponiveis', async () => {
    responderCom(lista([ITENS.disponivel, ITENS.manutencao], { totals: { total: 12, available: 9 } }));
    abrir();

    expect(await screen.findByRole('heading', { name: 'Catálogo' })).toBeTruthy();
    expect(await screen.findByText('9 de 12 equipamentos disponíveis agora')).toBeTruthy();
  });

  it('test_ca_07_mostra_fotos_pixabay_com_link', async () => {
    responderCom(lista([ITENS.disponivel]));
    abrir();

    const link = await screen.findByRole<HTMLAnchorElement>('link', { name: 'Pixabay' });

    expect(link.getAttribute('href')).toBe('https://pixabay.com/');
    expect(link.parentElement?.textContent).toBe('Fotos: Pixabay');
  });

  it('test_ca_07_chama_a_api_com_o_token_sem_mandar_tenant', async () => {
    responderCom(lista([ITENS.disponivel]));
    abrir();
    await card('TI-0001');

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('http://api.test/v1/equipment');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer tok');
  });

  it('test_ca_07_sem_proxima_pagina_nao_mostra_carregar_mais', async () => {
    responderCom(lista([ITENS.disponivel]));
    abrir();
    await card('TI-0001');

    expect(screen.queryByRole('button', { name: 'Carregar mais' })).toBeNull();
  });

  it('test_ca_07_carregar_mais_busca_a_proxima_pagina_pelo_cursor', async () => {
    fetchMock.mockImplementation((url) => {
      const corpo = url.includes('cursor=TI-0001')
        ? lista([ITENS.manutencao])
        : lista([ITENS.disponivel], { nextCursor: 'TI-0001' });
      return Promise.resolve(new Response(JSON.stringify(corpo), { status: 200 }));
    });
    abrir();
    await card('TI-0001');

    await userEvent.setup().click(screen.getByRole('button', { name: 'Carregar mais' }));

    expect(await card('TI-0004')).toBeTruthy();
    expect(screen.getByRole('article', { name: /TI-0001/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Carregar mais' })).toBeNull();
  });

  it('test_ca_07_sem_equipamentos_mostra_estado_vazio', async () => {
    responderCom(lista([], { totals: { total: 0, available: 0 } }));
    abrir();

    expect(await screen.findByText('Nenhum equipamento cadastrado.')).toBeTruthy();
  });

  it('test_ca_07_erro_da_api_mostra_mensagem_e_tentar_de_novo', async () => {
    responderCom({ type: 'about:blank', title: 'Error', status: 500 }, 500);
    abrir();

    // A tela tenta de novo duas vezes, com espera crescente, antes de mostrar o erro.
    const alerta = await screen.findByRole('alert', undefined, { timeout: 8_000 });
    expect(alerta.textContent).toContain('Não foi possível carregar o catálogo.');

    responderCom(lista([ITENS.disponivel]));
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await card('TI-0001')).toBeTruthy();
  });
});
