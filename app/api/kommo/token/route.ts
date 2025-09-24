import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null) as {
    token?: string;
    accountDomain?: string;
  } | null;

  if (!payload?.token || !payload?.accountDomain) {
    return NextResponse.json({ message: "Token e domínio são obrigatórios." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServiceClient();
    console.info("[Kommo] Token recebido para validação", {
      accountDomain: payload.accountDomain,
      tokenPreview: `${payload.token.slice(0, 4)}...`,
    });
    void supabase;
    // TODO: validar token na API do Kommo e salvar de forma criptografada no Supabase
  } catch (error) {
    console.error("Erro ao processar token Kommo", error);
    return NextResponse.json({ message: "Falha ao validar token." }, { status: 500 });
  }

  return NextResponse.json({ message: "Token recebido. Validaremos e avisaremos em instantes." }, { status: 202 });
}

