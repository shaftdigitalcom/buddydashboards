import type { Json } from "../types/database";
import { getSupabaseServiceRoleClient } from "../supabaseServiceRoleClient";

const supabase = getSupabaseServiceRoleClient();

export type MetricsCacheRecord = {
  payload: Json;
  ttlExpiresAt: string;
  updatedAt: string;
};

export async function readMetricsCache(
  userId: string,
  cacheKey: string,
  connectionId?: string
): Promise<MetricsCacheRecord | null> {
  let builder = supabase
    .from("metrics_cache")
    .select("payload, ttl_expires_at, updated_at")
    .eq("user_id", userId)
    .eq("cache_key", cacheKey);

  if (connectionId) {
    builder = builder.eq("connection_id", connectionId);
  }

  const { data, error } = await builder
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao ler metrics_cache: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    payload: data.payload,
    ttlExpiresAt: data.ttl_expires_at,
    updatedAt: data.updated_at,
  };
}

export async function writeMetricsCache(
  userId: string,
  cacheKey: string,
  payload: Json,
  ttlMs: number,
  connectionId?: string
) {
  const ttlExpiresAt = new Date(Date.now() + ttlMs).toISOString();

  const { error } = await supabase.from("metrics_cache").upsert(
    {
      user_id: userId,
      connection_id: connectionId ?? null,
      cache_key: cacheKey,
      payload,
      ttl_expires_at: ttlExpiresAt,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,cache_key",
    }
  );

  if (error) {
    throw new Error(`Erro ao gravar metrics_cache: ${error.message}`);
  }
}
