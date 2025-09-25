import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { envClient } from "./env.client";
import type { Database } from "./types/database";

export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  return createBrowserClient<Database>(
    envClient.NEXT_PUBLIC_SUPABASE_URL,
    envClient.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
