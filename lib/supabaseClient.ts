import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

type SupabaseSchema = unknown;

export function createSupabaseBrowserClient(): SupabaseClient<SupabaseSchema> {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente.");
  }

  return createClient<SupabaseSchema>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
}

export function createSupabaseServiceClient(): SupabaseClient<SupabaseSchema> {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Defina SUPABASE_SERVICE_ROLE_KEY para operações no servidor.");
  }

  return createClient<SupabaseSchema>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
