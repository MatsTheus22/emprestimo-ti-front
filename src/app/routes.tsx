import { Navigate, redirect, type RouteObject, useOutletContext } from 'react-router';
import type { AuthGateway } from '../auth/auth';
import type { Me } from '../auth/use-me';
import { LoginPage } from '../pages/LoginPage';
import { UnderConstruction } from '../pages/UnderConstruction';
import { AppShell } from './AppShell';
import { HOME_BY_ROLE } from './navigation';

// Spec 002 CA-08: rota interna sem sessão vai para /login; quem já está
// logado e abre /login vai para a home.
export function createRoutes(auth: AuthGateway): RouteObject[] {
  return [
    {
      path: '/login',
      loader: async () => ((await auth.getAccessToken()) ? redirect('/') : null),
      element: <LoginPage />,
    },
    {
      path: '/',
      loader: async () => ((await auth.getAccessToken()) ? null : redirect('/login')),
      element: <AppShell />,
      children: [
        { index: true, element: <HomeRedirect /> },
        { path: 'catalogo', element: <UnderConstruction title="Catálogo" /> },
        { path: 'meus-emprestimos', element: <UnderConstruction title="Meus empréstimos" /> },
        { path: 'operacoes', element: <UnderConstruction title="Operações" /> },
        { path: 'equipamentos', element: <UnderConstruction title="Equipamentos" /> },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ];
}

function HomeRedirect() {
  const me = useOutletContext<Me>();
  return <Navigate to={HOME_BY_ROLE[me.role]} replace />;
}
