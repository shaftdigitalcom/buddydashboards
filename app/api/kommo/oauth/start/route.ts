import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

const OAUTH_STATE_COOKIE = "kommo_oauth_state";
const ACCOUNT_COOKIE = "kommo_account_domain";

export async function GET(request: NextRequest) {
  const account = request.nextUrl.searchParams.get("account");

  if (!account) {
    return NextResponse.redirect(new URL("/onboarding/kommo?erro=dominio", request.url));
  }

  if (!env.KOMMO_CLIENT_ID || !env.KOMMO_REDIRECT_URI) {
    return NextResponse.redirect(new URL("/onboarding/kommo?erro=oauth-config", request.url));
  }

  const state = crypto.randomUUID();
  const authorizeUrl = new URL(`https://${account}.kommo.com/oauth/`);
  authorizeUrl.searchParams.set("client_id", env.KOMMO_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", env.KOMMO_REDIRECT_URI);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set({
    name: OAUTH_STATE_COOKIE,
    value: state,
    httpOnly: true,
    maxAge: 600,
    sameSite: "lax",
    secure: true,
    path: "/",
  });

  response.cookies.set({
    name: ACCOUNT_COOKIE,
    value: account,
    httpOnly: true,
    maxAge: 600,
    sameSite: "lax",
    secure: true,
    path: "/",
  });

  return response;
}
