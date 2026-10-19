// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureHttp } from '../api/http';
import { AuthContext, type AuthGateway } from '../auth/auth';
import { INVALID_CREDENTIALS } from '../pages/LoginPage';
import { NO_ACCESS } from './AppShell';
import { createRoutes } from './routes';

// Spec 002 CA-06..CA-09: o fluxo de login no navegador, com uma sessão
// falsa e a API /v1/me respondendo como a real (200 / 401 / 403).

const USERS: Record<string, { password: string; token: string }> = {
  'ana.ribeiro@emprestai.local': { password: 'certa', token: 'tok-ana' },
  'operacoes@emprestai.local': { password: 'certa', token: 'tok-ops' },
  'sem.acesso@emprestai.local': { password: 'certa', token: 'tok-sem' },
};

const ME: Record<string, object> = {
  'tok-ana': {
    userId: '11111111-1111-4111-8111-111111111111',
    displayName: 'Ana Ribeiro',
    role: 'colaborador',
    tenant: { id: '22222222-2222-4222-8222-222222222222', slug: 'suporte_ti', name: 'Suporte de TI' },
  },
  'tok-ops': {
    userId: '33333333-3333-4333-8333-333333333333',
    displayName: 'Operações TI',
    role: 'operacoes',
    tenant: { id: '22222222-2222-4222-8222-222222222222', slug: 'suporte_ti', name: 'Suporte de TI' },
  },
};

function fakeAuth(initialToken: string | null = null) {
  let token = initialToken;
  const auth: AuthGateway & { signOutCalls: number } = {
    signOutCalls: 0,
    getAccessToken: () => Promise.resolve(token),
    signIn: (email, password) => {
      const user = USERS[email];
      if (!user || user.password !== password) return Promise.resolve('invalid_credentials');
      token = user.token;
      return Promise.resolve('ok');
    },
    signOut: () => {
      auth.signOutCalls++;
      token = null;
      return Promise.resolve();
    },
  };
  return auth;
}

function problem(status: number, title: string, detail: string) {
  return new Response(JSON.stringify({ type: 'about:blank', title, status, detail, instance: '/v1/me' }), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

// Imita GET /v1/me da API: lê o Bearer e responde como o back.
const fetchMock = vi.fn((url: string, init?: RequestInit) => {
  expect(url).toBe('http://api.test/v1/me');
  const token = new Headers(init?.headers).get('Authorization')?.replace('Bearer ', '');
  if (!token) return Promise.resolve(problem(401, 'Unauthorized', 'Token ausente'));
  const me = ME[token];
  if (!me) return Promise.resolve(problem(403, 'Forbidden', NO_ACCESS));
  return Promise.resolve(Response.json(me));
});

function renderApp(auth: AuthGateway, path: string) {
  configureHttp({ baseUrl: 'http://api.test/v1', getAccessToken: () => auth.getAccessToken() });
  const router = createMemoryRouter(createRoutes(auth), { initialEntries: [path] });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <AuthContext value={auth}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthContext>,
  );
  return router;
}

async function login(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('E-mail'), email);
  await user.type(screen.getByLabelText('Senha'), password);
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
}

function tabs(): string[] {
  return screen
    .getAllByRole('link')
    .filter((link) => link.classList.contains('nav-tab'))
    .map((link) => link.textContent ?? '');
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  fetchMock.mockClear();
});

describe('login', () => {
  it('test_ca_08_rota_interna_sem_sessao_vai_para_o_login', async () => {
    const router = renderApp(fakeAuth(), '/catalogo');

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('test_ca_06_credencial_errada_mostra_mensagem_generica', async () => {
    renderApp(fakeAuth(), '/login');

    await login('ana.ribeiro@emprestai.local', 'errada');

    expect((await screen.findByRole('alert')).textContent).toBe(INVALID_CREDENTIALS);
  });

  it('test_ca_07_colaborador_entra_e_cai_no_catalogo_com_a_nav_do_papel', async () => {
    const router = renderApp(fakeAuth(), '/login');

    await login('ana.ribeiro@emprestai.local', 'certa');

    expect(await screen.findByRole('heading', { name: 'Catálogo' })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/catalogo');
    expect(tabs()).toEqual(['Catálogo', 'Meus empréstimos']);
    expect(screen.getByText('Colaborador')).toBeTruthy();
    expect(screen.getByText('AR')).toBeTruthy();
    expect(screen.getByText('Ana Ribeiro')).toBeTruthy();
    expect(screen.getByText('Em construção.')).toBeTruthy();
  });

  it('test_ca_07_operacoes_entra_e_cai_em_operacoes_com_quatro_abas', async () => {
    const router = renderApp(fakeAuth(), '/login');

    await login('operacoes@emprestai.local', 'certa');

    expect(await screen.findByRole('heading', { name: 'Operações' })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/operacoes');
    expect(tabs()).toEqual(['Catálogo', 'Operações', 'Equipamentos', 'Meus empréstimos']);
  });

  it('test_ca_07_colaborador_nao_abre_aba_de_operacoes_pela_url', async () => {
    const router = renderApp(fakeAuth('tok-ana'), '/operacoes');

    await screen.findByRole('heading', { name: 'Catálogo' });
    expect(router.state.location.pathname).toBe('/catalogo');
  });

  it('test_ca_08_sessao_existente_entra_direto_sem_login', async () => {
    renderApp(fakeAuth('tok-ana'), '/catalogo');

    expect(await screen.findByRole('heading', { name: 'Catálogo' })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('test_ca_08_sair_encerra_a_sessao_e_volta_ao_login', async () => {
    const auth = fakeAuth('tok-ana');
    const router = renderApp(auth, '/catalogo');

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/login');
    expect(auth.signOutCalls).toBe(1);
  });

  it('test_ca_09_usuario_sem_membership_ve_sem_acesso_e_pode_sair', async () => {
    const auth = fakeAuth();
    renderApp(auth, '/login');

    await login('sem.acesso@emprestai.local', 'certa');

    expect((await screen.findByRole('alert')).textContent).toContain(NO_ACCESS);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sair' }));
    await waitFor(() => expect(auth.signOutCalls).toBe(1));
  });
});
