import { useQueryClient } from '@tanstack/react-query';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { ApiError } from '../api/http';
import { useAuth } from '../auth/auth';
import { type Me, useMe } from '../auth/use-me';
import { Brand } from './Brand';
import { initials, ROLE_LABEL, TABS_BY_ROLE } from './navigation';

export const NO_ACCESS = 'Seu usuário não tem acesso. Fale com Operações.';

// Moldura das telas internas: barra de navegação (layout.md §6) + conteúdo.
export function AppShell() {
  const me = useMe();
  const signOut = useSignOut();

  if (me.isPending) return <p style={{ padding: 40, color: 'var(--color-text-55)' }}>Carregando…</p>;

  if (me.isError) {
    // Token expirado/inválido: volta ao login.
    if (me.error instanceof ApiError && me.error.status === 401) return <Navigate to="/login" replace />;
    // Spec 002 CA-09: autenticado mas sem membership.
    if (me.error instanceof ApiError && me.error.status === 403) {
      return <Notice title="Sem acesso" text={NO_ACCESS} onSignOut={signOut} />;
    }
    return <Notice title="Erro" text="Não foi possível carregar seus dados." onSignOut={signOut} />;
  }

  return (
    <>
      <NavBar me={me.data} onSignOut={signOut} />
      <RoleGuard me={me.data}>
        <Outlet context={me.data} />
      </RoleGuard>
    </>
  );
}

function NavBar({ me, onSignOut }: { me: Me; onSignOut: () => void }) {
  return (
    <header className="nav">
      <Brand />
      <nav aria-label="Principal" style={{ display: 'flex', alignItems: 'stretch' }}>
        {TABS_BY_ROLE[me.role].map((tab) => (
          <NavLink key={tab.path} to={tab.path} className="nav-tab">
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="tag tag-outline">{ROLE_LABEL[me.role]}</span>
        <span
          aria-hidden
          style={{
            display: 'inline-grid',
            placeItems: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '1px solid var(--color-accent-700)',
            background: 'var(--color-accent-900)',
            color: 'var(--color-accent-300)',
            fontSize: 11.5,
            fontWeight: 600,
          }}
        >
          {initials(me.displayName)}
        </span>
        <span style={{ fontSize: 13.5 }}>{me.displayName}</span>
        <button type="button" className="btn btn-ghost" onClick={onSignOut}>
          Sair
        </button>
      </div>
    </header>
  );
}

// Aba de outro papel digitada na URL volta para a home do papel.
function RoleGuard({ me, children }: { me: Me; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const allowed = TABS_BY_ROLE[me.role].some((tab) => pathname.startsWith(tab.path));
  if (pathname !== '/' && !allowed) return <Navigate to="/" replace />;
  return children;
}

function Notice({ title, text, onSignOut }: { title: string; text: string; onSignOut: () => void }) {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 40 }}>
      <div className="card" role="alert" style={{ width: 420, display: 'grid', gap: 14 }}>
        <Brand />
        <h1 style={{ fontSize: 20 }}>{title}</h1>
        <p style={{ color: 'var(--color-text-62)' }}>{text}</p>
        <button type="button" className="btn btn-secondary" onClick={onSignOut}>
          Sair
        </button>
      </div>
    </main>
  );
}

// Spec 002 CA-08: encerra a sessão, esquece os dados do usuário e volta ao login.
function useSignOut() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return () => {
    void auth.signOut().then(async () => {
      queryClient.clear();
      await navigate('/login', { replace: true });
    });
  };
}
