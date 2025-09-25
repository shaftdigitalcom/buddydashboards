import { LRUCache } from "lru-cache";

import { KommoAuth, kommoRequest } from "./kommo";

const metadataCache = new LRUCache<string, any>({
  max: 200,
  ttl: 1000 * 60 * 15,
});

type KommoEmbedded<T> = {
  _embedded?: T;
  _links?: {
    next?: {
      href: string;
    };
  };
};

type PaginatedResponse<T> = KommoEmbedded<T> & {
  page?: number;
};

export type KommoPipelineStatus = {
  id: number;
  name: string;
  sort: number;
  type?: number;
  color?: string;
};

export type KommoPipeline = {
  id: number;
  name: string;
  is_main?: boolean;
  sort?: number;
  _embedded?: {
    statuses?: KommoPipelineStatus[];
  };
};

export type KommoUser = {
  id: number;
  name: string;
  email?: string;
  role_id?: number;
  is_active?: boolean;
};

export type LeadStatusChangedValue = {
  pipeline_id?: number;
  status_id?: number;
  responsible_user_id?: number;
};

export type KommoEvent<TValueBefore = LeadStatusChangedValue, TValueAfter = LeadStatusChangedValue> = {
  id: string;
  type: string;
  entity_id: number;
  entity_type: string;
  created_by: number;
  created_at: number;
  value_before?: TValueBefore;
  value_after?: TValueAfter;
  account_id: number;
};

type KommoEventsEmbedded = {
  events?: KommoEvent[];
};

type KommoPipelinesEmbedded = {
  pipelines?: KommoPipeline[];
};

type KommoUsersEmbedded = {
  users?: KommoUser[];
};

type KommoLeadsEmbedded = {
  leads?: KommoLead[];
};

export type KommoLead = {
  id: number;
  name?: string;
  price?: number;
  pipeline_id?: number;
  status_id?: number;
  responsible_user_id?: number;
  created_at?: number;
  closed_at?: number | null;
};

async function fetchAllPages<TEmbedded extends Record<string, unknown>>(
  accountDomain: string,
  auth: KommoAuth,
  initialPath: string,
  extractor: (embedded?: TEmbedded) => any[] | undefined
): Promise<any[]> {
  const items: any[] = [];
  let nextPath: string | null = initialPath;

  while (nextPath) {
    const response: PaginatedResponse<TEmbedded> = await kommoRequest<PaginatedResponse<TEmbedded>>({
      accountDomain,
      path: nextPath,
      auth,
    });

    const chunk = extractor(response._embedded);
    if (chunk?.length) {
      items.push(...chunk);
    }

    const nextHref = response._links?.next?.href ?? null;
    if (nextHref) {
      const url = new URL(nextHref, `https://${accountDomain}.kommo.com/`);
      nextPath = `${url.pathname}${url.search}`;
    } else {
      nextPath = null;
    }
  }

  return items;
}

function getMetadataCache<T>(key: string): T | undefined {
  return metadataCache.get(key) as T | undefined;
}

function setMetadataCache<T>(key: string, value: T, ttlMs: number) {
  metadataCache.set(key, value, { ttl: ttlMs });
}

export async function fetchPipelines(
  accountDomain: string,
  auth: KommoAuth
): Promise<KommoPipeline[]> {
  const cacheKey = `${accountDomain}:pipelines`;
  const cached = getMetadataCache<KommoPipeline[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const pipelines = await fetchAllPages<KommoPipelinesEmbedded>(
    accountDomain,
    auth,
    "api/v4/leads/pipelines?with=statuses&limit=50",
    (embedded) => embedded?.pipelines
  );

  setMetadataCache(cacheKey, pipelines, 1000 * 60 * 15);
  return pipelines;
}

export async function fetchUsers(accountDomain: string, auth: KommoAuth): Promise<KommoUser[]> {
  const cacheKey = `${accountDomain}:users`;
  const cached = getMetadataCache<KommoUser[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const users = await fetchAllPages<KommoUsersEmbedded>(
    accountDomain,
    auth,
    "api/v4/users?limit=200",
    (embedded) => embedded?.users
  );

  setMetadataCache(cacheKey, users, 1000 * 60 * 15);
  return users;
}

export async function fetchLeadStatusChangedEvents(
  accountDomain: string,
  auth: KommoAuth,
  params: {
    from: number;
    to: number;
    pageLimit?: number;
  }
): Promise<KommoEvent[]> {
  const searchParams = new URLSearchParams();
  searchParams.append("filter[type][]", "lead_status_changed");
  searchParams.append("filter[entity][]", "lead");
  searchParams.append("filter[created_at][from]", Math.floor(params.from).toString());
  searchParams.append("filter[created_at][to]", Math.floor(params.to).toString());
  searchParams.append("limit", String(params.pageLimit ?? 200));

  const path = `api/v4/events?${searchParams.toString()}`;

  return fetchAllPages<KommoEventsEmbedded>(
    accountDomain,
    auth,
    path,
    (embedded) => embedded?.events
  );
}

async function fetchLeadsBatch(
  accountDomain: string,
  auth: KommoAuth,
  ids: number[]
): Promise<KommoLead[]> {
  if (!ids.length) {
    return [];
  }

  const searchParams = new URLSearchParams();
  ids.forEach((id) => searchParams.append("filter[id][]", id.toString()));
  searchParams.append("limit", "250");

  const response = await kommoRequest<PaginatedResponse<KommoLeadsEmbedded>>({
    accountDomain,
    auth,
    path: `api/v4/leads?${searchParams.toString()}`,
  });

  return response._embedded?.leads ?? [];
}

export async function fetchLeadsByIds(
  accountDomain: string,
  auth: KommoAuth,
  ids: number[],
  batchSize = 200
): Promise<KommoLead[]> {
  const uniqueIds = Array.from(new Set(ids));
  const results: KommoLead[] = [];

  for (let i = 0; i < uniqueIds.length; i += batchSize) {
    const chunk = uniqueIds.slice(i, i + batchSize);
    const leads = await fetchLeadsBatch(accountDomain, auth, chunk);
    results.push(...leads);
  }

  return results;
}



