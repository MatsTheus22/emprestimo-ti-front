// Transporte de todo o cliente gerado pelo orval: põe a base da API e o
// token da sessão (ADR-001 §7: token no header) e converte erro em
// ApiError com o Problem Details da API (ADR-001 §4) — as telas decidem
// por status, nunca lendo string de mensagem.

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}

export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly status: number;
  readonly problem: ProblemDetails | null;

  constructor(status: number, problem: ProblemDetails | null) {
    super(problem?.detail ?? problem?.title ?? `HTTP ${status}`);
    this.status = status;
    this.problem = problem;
  }
}

interface HttpConfig {
  baseUrl: string;
  getAccessToken: () => Promise<string | null>;
}

let config: HttpConfig | null = null;

// As rotas do OpenAPI já trazem /v1; aceita VITE_API_BASE_URL com ou sem ele.
export function configureHttp({ baseUrl, getAccessToken }: HttpConfig): void {
  config = { baseUrl: baseUrl.replace(/\/v1\/?$/, '').replace(/\/$/, ''), getAccessToken };
}

export async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  if (!config) throw new Error('configureHttp() não foi chamado');

  const headers = new Headers(init.headers);
  const token = await config.getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(config.baseUrl + url, { ...init, headers });
  const body: unknown = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) throw new ApiError(res.status, isProblem(body) ? body : null);
  return { data: body, status: res.status, headers: res.headers } as T;
}

function isProblem(body: unknown): body is ProblemDetails {
  return typeof body === 'object' && body !== null && 'status' in body && 'title' in body;
}
