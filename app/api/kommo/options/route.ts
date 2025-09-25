import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { envClient } from "@/lib/env.client";
import { fetchPipelines, fetchUsers } from "@/lib/kommoData";
import { getLatestKommoConnection } from "@/lib/kommoConnection";

function mapPipeline(pipeline: Awaited<ReturnType<typeof fetchPipelines>>[number]) {
  const statuses = pipeline._embedded?.statuses ?? [];

  const wonStatuses = statuses.filter((status) => status.type === 1 || status.id === 142);
  const lostStatuses = statuses.filter((status) => status.type === 2 || status.id === 143);

  return {
    id: pipeline.id,
    name: pipeline.name,
    isMain: Boolean(pipeline.is_main),
    statuses: statuses.map((status) => ({
      id: status.id,
      name: status.name,
      sort: status.sort,
      type: status.type ?? null,
      isWon: wonStatuses.some((item) => item.id === status.id),
      isLost: lostStatuses.some((item) => item.id === status.id),
    })),
    wonStatusIds: wonStatuses.map((status) => status.id),
    lostStatusIds: lostStatuses.map((status) => status.id),
  };
}

function mapUser(user: Awaited<ReturnType<typeof fetchUsers>>[number]) {
  return {
    id: user.id,
    name: user.name,
    email: user.email ?? null,
    isActive: user.is_active ?? null,
  };
}

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
    return NextResponse.json({ message: "Usuario Nao autenticado" }, { status: 401 });
  }

  const connection = await getLatestKommoConnection(user.id);

  if (!connection) {
    return NextResponse.json({ message: "Integracao Kommo Nao configurada" }, { status: 404 });
  }

  try {
    const [pipelines, users] = await Promise.all([
      fetchPipelines(connection.accountDomain, connection.auth),
      fetchUsers(connection.accountDomain, connection.auth),
    ]);

    return NextResponse.json({
      timezone: connection.metadata.timezone ?? "UTC",
      pipelines: pipelines.map(mapPipeline),
      users: users.map(mapUser),
      metadata: connection.metadata,
      accountDomain: connection.accountDomain,
      updatedAt: connection.updatedAt,
    });
  } catch (error) {
    console.error("Erro ao carregar opcoes Kommo", error);
    return NextResponse.json({ message: "Nao foi possivel carregar opcoes do Kommo" }, { status: 500 });
  }
}








