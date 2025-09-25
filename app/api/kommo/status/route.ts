import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { envClient } from "@/lib/env.client";

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    envClient.NEXT_PUBLIC_SUPABASE_URL,
    envClient.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {
          /* noop */
        },
        remove() {
          /* noop */
        },
      } as any,
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ connected: false }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("kommo_connections")
    .select("account_domain, metadata, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    accountDomain: data.account_domain,
    metadata: data.metadata,
    updatedAt: data.updated_at,
  });
}
