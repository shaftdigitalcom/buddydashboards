import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { envClient } from "@/lib/env.client";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ message: "ok" });

  const supabase = createServerClient(
    envClient.NEXT_PUBLIC_SUPABASE_URL,
    envClient.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options?: any) {
          response.cookies.set(name, value, options);
        },
        remove(name: string) {
          response.cookies.delete(name);
        },
      } as any,
    }
  );

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Erro ao deslogar", error.message);
    return NextResponse.json({ message: "Não foi possível sair." }, { status: 500 });
  }

  return response;
}
