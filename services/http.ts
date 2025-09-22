export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

interface ApiFetchOptions extends RequestInit {
  expectJson?: boolean;
}

let onUnauthorizedHandler: null | (() => Promise<void> | void) = null;

export function setUnauthorizedHandler(handler: () => Promise<void> | void) {
  onUnauthorizedHandler = handler;
}

export async function apiFetch(input: RequestInfo | URL, init: ApiFetchOptions = {}) {
  const { expectJson = false, ...rest } = init;
  const attempt = async () => {
    const res = await fetch(input, rest);
    if (res.status === 401) {
      throw new UnauthorizedError();
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API request failed: ${res.status} ${text}`);
    }
    return expectJson ? res.json() : res;
  };

  try {
    return await attempt();
  } catch (err) {
    if (err instanceof UnauthorizedError && onUnauthorizedHandler) {
      try {
        await onUnauthorizedHandler();
        // Retry once after re-auth
        return await attempt();
      } catch (e) {
        throw err; // bubble original Unauthorized if retry fails
      }
    }
    throw err;
  }
}
