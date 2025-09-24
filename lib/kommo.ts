import Bottleneck from "bottleneck";
import { LRUCache } from "lru-cache";

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
  minTime: 350,
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

export async function kommoRequest<T>(options: KommoRequestOptions): Promise<T | null> {
  const { accountDomain, path, method = "GET", body, auth, cacheKey, cacheTtlMs } = options;
  const url = new URL(path, `https://${accountDomain}.kommo.com/`);

  if (cacheKey && cache.has(cacheKey)) {
    return cache.get(cacheKey) as T;
  }

  const requestInit: RequestInit = {
    method,
    headers: {
      Authorization: createAuthHeader(auth),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  const execute = async () => {
    console.info(`[Kommo] Requisição simulada: ${method} ${url.toString()}`);
    void requestInit;
    // TODO: substituir por fetch real e tratar erros + renovação de token
    return null as T | null;
  };

  const result = await limiter.schedule(execute);

  if (cacheKey && cacheTtlMs) {
    cache.set(cacheKey, result, { ttl: cacheTtlMs });
  }

  return result;
}

export function invalidateKommoCache(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}
