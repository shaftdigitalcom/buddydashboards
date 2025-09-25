import { LRUCache } from "lru-cache";

import { KommoAuth } from "./kommo";
import { decryptSecret } from "./security/crypto";
import { getSupabaseServiceRoleClient } from "./supabaseServiceRoleClient";
import type { Database } from "./types/database";

export type KommoConnectionMetadata = {
  account_id?: number | null;
  name?: string | null;
  timezone?: string | null;
  method?: string | null;
  [key: string]: unknown;
};

export type ResolvedKommoConnection = {
  id: string;
  userId: string;
  accountDomain: string;
  auth: KommoAuth;
  metadata: KommoConnectionMetadata;
  updatedAt: string;
};

const cache = new LRUCache<string, ResolvedKommoConnection>({
  max: 100,
  ttl: 1000 * 60,
});

const supabase = getSupabaseServiceRoleClient();

type KommoConnectionRow = Database["public"]["Tables"]["kommo_connections"]["Row"];

function buildAuth(row: KommoConnectionRow): KommoAuth {
  if (row.auth_type === "oauth") {
    const accessToken = row.access_token_encrypted ? decryptSecret(row.access_token_encrypted) : "";
    const refreshToken = row.refresh_token_encrypted ? decryptSecret(row.refresh_token_encrypted) : undefined;
    const expiresAt = row.expires_at ? Date.parse(row.expires_at) : null;

    return {
      type: "oauth",
      accessToken,
      refreshToken,
      expiresAt: Number.isNaN(expiresAt) ? null : expiresAt,
    };
  }

  if (!row.access_token_encrypted) {
    throw new Error("Kommo connection missing access token");
  }

  const token = decryptSecret(row.access_token_encrypted);

  return {
    type: "token",
    token,
  };
}

function normalizeConnection(row: KommoConnectionRow): ResolvedKommoConnection {
  return {
    id: row.id,
    userId: row.user_id,
    accountDomain: row.account_domain,
    auth: buildAuth(row),
    metadata: ((row.metadata as KommoConnectionMetadata | null) ?? {}),
    updatedAt: row.updated_at,
  };
}

export async function getLatestKommoConnection(userId: string): Promise<ResolvedKommoConnection | null> {
  const cached = cache.get(userId);
  if (cached) {
    return cached;
  }

  const { data, error } = await supabase
    .from("kommo_connections")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar conexoes Kommo: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const connection = normalizeConnection(data);
  cache.set(userId, connection);
  return connection;
}

export function invalidateKommoConnectionCache(userId?: string) {
  if (!userId) {
    cache.clear();
    return;
  }

  cache.delete(userId);
}




