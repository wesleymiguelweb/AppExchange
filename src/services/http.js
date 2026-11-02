const DEFAULT_TIMEOUT_MS = 12_000;

/**
 * Erro normalizado da camada de rede.
 * `type`: 'network' | 'http' | 'invalid' | 'timeout'
 */
export class ApiError extends Error {
  constructor(message, { type = 'unknown', status = null, cause } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
  }
}

export function isAbortError(error) {
  return (
    error?.name === 'AbortError' ||
    error?.name === 'TimeoutError' ||
    error?.name === 'AbortSignalError'
  );
}

/**
 * fetch + async/await com timeout, cancelamento e respostas inválidas tratadas.
 * Nunca devolve corpo que não seja um objeto/array JSON.
 */
export async function fetchJson(url, { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException('Tempo de requisição esgotado', 'TimeoutError'));
  }, timeoutMs);

  const forwardAbort = () => controller.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) forwardAbort();
    else signal.addEventListener('abort', forwardAbort, { once: true });
  }

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new ApiError(`Falha HTTP ${response.status}`, {
        type: 'http',
        status: response.status,
      });
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw new ApiError('A resposta não é um JSON válido', { type: 'invalid', cause: error });
    }

    if (data === null || typeof data !== 'object') {
      throw new ApiError('Resposta inesperada do serviço de câmbio', { type: 'invalid' });
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (isAbortError(error)) throw error;
    throw new ApiError('Não foi possível contatar o serviço de câmbio', {
      type: 'network',
      cause: error,
    });
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', forwardAbort);
  }
}
