import { type MeDtoOutput, useMeControllerGet } from '../api/generated';
import { retryUnlessDenied } from '../api/retry';

export type Me = MeDtoOutput;

// Quem está logado (GET /v1/me). O apiFetch lança ApiError em qualquer
// status de erro, então aqui só chega a resposta 200.
export function useMe() {
  return useMeControllerGet({
    query: {
      select: (response) => response.data as Me,
      retry: retryUnlessDenied,
    },
  });
}
