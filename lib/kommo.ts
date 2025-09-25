import Bottleneck from "bottleneck";
import { LRUCache } from "lru-cache";

export class KommoRequestError extends Error {
  status: number;
  detail?: unknown;

  constructor(message: string, options: { status: number; detail?: unknown }) {
    super(message);
    this.name = "KommoRequestError";
    this.status = options.status;
    this.detail = options.detail;
  }

  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  get isRateLimitError(): boolean {
    return this.status === 429;
  }
}

type OAuthAuth = {
  type: "oauth";
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number | null;
};

type TokenAuth = {
  type: "token";
  token: string;
};

export type KommoAuth = OAuthAuth | TokenAuth;

export type KommoRequestOptions = {
  accountDomain: string;
  path: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth: KommoAuth;
  cacheKey?: string;
  cacheTtlMs?: number;
};

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 400,
});

const cache = new LRUCache<string, any>({
  max: 200,
  ttl: 1000 * 60 * 5,
});

function createAuthHeader(auth: KommoAuth): string {
  if (auth.type === "oauth") {
    return `Bearer ${auth.accessToken}`;
  }

  return `Bearer ${auth.token}`;
}

async function parseKommoResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("json");

  if (!isJson) {
    const textPayload = await response.text().catch(() => "");
    return textPayload as unknown as T;
  }

  return (await response.json()) as T;
}

async function handleRequest<T>(url: URL, init: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch (error) {
    throw new KommoRequestError("Fetch failed", { status: 0, detail: error });
  }

  if (!response.ok) {
    let detail: unknown;
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("json")) {
      detail = await response.json().catch(() => undefined);
    } else {
      detail = await response.text().catch(() => undefined);
    }

    throw new KommoRequestError(`${response.status} ${response.statusText}`, {
      status: response.status,
      detail,
    });
  }

  return parseKommoResponse<T>(response);
}

export async function kommoRequest<T>(options: KommoRequestOptions): Promise<T> {
  const { accountDomain, path, method = "GET", body, auth, cacheKey, cacheTtlMs } = options;
  const url = new URL(path, `https://${accountDomain}.kommo.com/`);

  const effectiveCacheKey = cacheKey ?? (method === "GET" && !body ? `${accountDomain}:${path}` : undefined);

  if (effectiveCacheKey && cache.has(effectiveCacheKey)) {
    return cache.get(effectiveCacheKey) as T;
  }

  const init: RequestInit = {
    method,
    headers: {
      Authorization: createAuthHeader(auth),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  const attemptRequest = async (): Promise<T> => {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await handleRequest<T>(url, init);
      } catch (error) {
        const shouldRetry =
          error instanceof KommoRequestError &&
          (error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500);

        if (!shouldRetry || attempt === maxAttempts) {
          throw error;
        }

        const backoffMs = 250 * attempt * attempt;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    throw new KommoRequestError("Unexpected retry failure", { status: 0 });
  };

  try {
    const result = await limiter.schedule(attemptRequest);

    if (effectiveCacheKey) {
      if (cacheTtlMs) {
        cache.set(effectiveCacheKey, result, { ttl: cacheTtlMs });
      } else {
        cache.set(effectiveCacheKey, result);
      }
    }

    return result;
  } catch (error) {
    if (effectiveCacheKey) {
      cache.delete(effectiveCacheKey);
    }

    throw error;
  }
}

export function invalidateKommoCache(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

