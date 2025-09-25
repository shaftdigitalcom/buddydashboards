import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { envClient } from "@/lib/env.client";
import { envServer } from "@/lib/env.server";
import { encryptSecret } from "@/lib/security/crypto";

const payloadSchema = z.object({
  token: z.string().min(10),
  accountDomain: z.string().min(2),
});

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessão expirada. Faça login novamente." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Informações inválidas", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { token, accountDomain } = parsed.data;
  const cleanDomain = accountDomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\.kommo\.com$/, "");

  try {
    const validationResponse = await fetch(
      `https://${cleanDomain}.kommo.com/api/v4/account`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!validationResponse.ok) {
      const text = await validationResponse.text();
      return NextResponse.json(
        {
          message: "Token inválido ou sem permissão.",
          details: text || validationResponse.statusText,
        },
        { status: 400 }
      );
    }

    const accountPayload = await validationResponse.json().catch(() => ({}));

    const encryptedToken = encryptSecret(token);

    const upsertPayload = {
      user_id: user.id,
      account_domain: cleanDomain,
      auth_type: "token" as const,
      access_token_encrypted: `\\x${encryptedToken.toString("hex")}`,
      refresh_token_encrypted: null,
      expires_at: null,
      metadata: {
        account_id: accountPayload.account_id ?? accountPayload.id ?? null,
        name: accountPayload.name ?? accountPayload.account_name ?? null,
        timezone: accountPayload.timezone ?? null,
        retrieved_at: new Date().toISOString(),
        method: "token",
      },
    };

    const { error } = await supabase
      .from("kommo_connections")
      .upsert(upsertPayload, { onConflict: "user_id,account_domain" });

    if (error) {
      console.error("Erro Supabase ao salvar token", error.message);
      return NextResponse.json({ message: "Não foi possível salvar a conexão." }, { status: 500 });
    }

    return NextResponse.json({
      message: "Conexão Kommo configurada",
      account: {
        domain: `${cleanDomain}.kommo.com`,
        name: upsertPayload.metadata.name,
      },
    });
  } catch (error) {
    console.error("Erro ao validar token Kommo", error);
    return NextResponse.json(
      { message: "Erro inesperado ao validar o token. Tente novamente." },
      { status: 500 }
    );
  }
}
