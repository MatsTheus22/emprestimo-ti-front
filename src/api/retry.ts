import { ApiError } from './http';

// 401/403 não melhoram tentando de novo.
export function retryUnlessDenied(failures: number, error: unknown): boolean {
  return !(error instanceof ApiError && [401, 403].includes(error.status)) && failures < 2;
}
