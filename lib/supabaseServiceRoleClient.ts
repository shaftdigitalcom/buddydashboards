import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { envServer } from "./env.server";
import type { Database } from "./types/database";

export function getSupabaseServiceRoleClient(): SupabaseClient<Database> {
  return createClient<Database>(
    envServer.NEXT_PUBLIC_SUPABASE_URL,
    envServer.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
