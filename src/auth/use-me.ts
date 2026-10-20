import { ApiError } from '../api/http';
import { type MeDtoOutput, useMeControllerGet } from '../api/generated';

export type Me = MeDtoOutput;

// Quem está logado (GET /v1/me). O apiFetch lança ApiError em qualquer
// status de erro, então aqui só chega a resposta 200.
export function useMe() {
  return useMeControllerGet({
    query: {
      select: (response) => response.data as Me,
      // 401/403 não melhoram tentando de novo.
      retry: (failures, error) =>
        !(error instanceof ApiError && [401, 403].includes(error.status)) && failures < 2,
    },
  });
}
