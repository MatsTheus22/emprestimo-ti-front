import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { Brand } from '../app/Brand';
import { useAuth } from '../auth/auth';

const loginSchema = z.object({
  email: z.email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe a senha'),
});
type LoginForm = z.infer<typeof loginSchema>;

export const INVALID_CREDENTIALS = 'E-mail ou senha incorretos';

const STATS = [
  { value: '3', label: 'itens por pessoa' },
  { value: '14', label: 'dias de prazo' },
  { value: '0', label: 'linhas para preencher' },
];

// layout.md §5.1 · spec 002 CA-06.
export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async ({ email, password }: LoginForm) => {
    try {
      const result = await auth.signIn(email, password);
      if (result === 'ok') {
        await navigate('/', { replace: true });
        return;
      }
      setError('root', { message: INVALID_CREDENTIALS });
    } catch {
      setError('root', { message: 'Não foi possível entrar agora. Tente de novo.' });
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', minHeight: 820 }}>
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 40,
          padding: '64px 56px',
          background: 'linear-gradient(160deg, #1b1f2e, #161826 60%)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: -160,
            top: 120,
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(47,184,172,0.16), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative' }}>
          <Brand size={17} />
        </div>

        <div style={{ position: 'relative', display: 'grid', gap: 18, maxWidth: 520 }}>
          <h1 style={{ fontSize: 44 }}>
            Equipamentos de TI,
            <br />
            sem planilha.
          </h1>
          <p style={{ fontSize: 16, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
            Veja o que está disponível, peça um item e devolva no balcão. Operações acompanha tudo
            em um só lugar.
          </p>
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              margin: '12px 0 0',
              paddingTop: 20,
              borderTop: '1px solid var(--color-divider)',
            }}
          >
            {STATS.map((stat) => (
              <div key={stat.label} style={{ display: 'grid', gap: 2 }}>
                <dt style={{ fontSize: 30, fontWeight: 600, color: 'var(--color-accent)' }}>
                  {stat.value}
                </dt>
                <dd style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text-55)' }}>
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p style={{ position: 'relative', fontSize: 12, color: 'var(--color-text-40)' }}>
          Operações · TI interno
        </p>
      </section>

      <section style={{ display: 'grid', placeItems: 'center', padding: '64px 56px' }}>
        <form
          noValidate
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
          style={{ width: 340, display: 'grid', gap: 16 }}
        >
          <div style={{ display: 'grid', gap: 6 }}>
            <h2 style={{ fontSize: 26 }}>Entrar</h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-55)' }}>
              Use o e-mail e a senha que Operações cadastrou para você.
            </p>
          </div>

          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input"
              aria-invalid={errors.email ? true : undefined}
              {...register('email')}
            />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="input"
              aria-invalid={errors.password ? true : undefined}
              {...register('password')}
            />
            {errors.password && <FieldError>{errors.password.message}</FieldError>}
          </div>

          {errors.root && (
            <p
              role="alert"
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--status-error-bd)',
                background: 'var(--status-error-bg)',
                color: 'var(--status-error-fg)',
                fontSize: 13,
              }}
            >
              {errors.root.message}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ height: 40 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>

          <p style={{ fontSize: 12, color: 'var(--color-text-45)', textAlign: 'center' }}>
            Cada pessoa vê apenas os próprios empréstimos
          </p>
        </form>
      </section>
    </div>
  );
}

function FieldError({ children }: { children?: string }) {
  return <span style={{ fontSize: 12, color: 'var(--status-error-fg)' }}>{children}</span>;
}
