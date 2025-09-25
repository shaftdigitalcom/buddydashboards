import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { envServer } from "@/lib/env.server";
import { getSupabaseServiceRoleClient } from "@/lib/supabaseServiceRoleClient";

const OAUTH_STATE_COOKIE = "kommo_oauth_state";
const ACCOUNT_COOKIE = "kommo_account_domain";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const storedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  const accountDomain = cookieStore.get(ACCOUNT_COOKIE)?.value;

  if (error) {
    return NextResponse.redirect(new URL(`/onboarding/kommo?erro=${error}`, request.url));
  }

  if (!code || !state || state !== storedState || !accountDomain) {
    return NextResponse.redirect(new URL("/onboarding/kommo?erro=oauth-invalid", request.url));
  }

  if (!envServer.KOMMO_CLIENT_ID || !envServer.KOMMO_CLIENT_SECRET || !envServer.KOMMO_REDIRECT_URI) {
    return NextResponse.redirect(new URL("/onboarding/kommo?erro=oauth-config", request.url));
  }

  try {
    const supabase = getSupabaseServiceRoleClient();
    console.info("[Kommo] Código recebido", {
      code: code.slice(0, 4).padEnd(code.length, "*"),
      accountDomain,
    });
    void supabase;
  } catch (err) {
    console.error("Falha ao finalizar OAuth", err);
    return NextResponse.redirect(new URL("/onboarding/kommo?erro=oauth-token", request.url));
  }

  const response = NextResponse.redirect(new URL("/dashboard?setup=ok", request.url));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(ACCOUNT_COOKIE);

  return response;
}
