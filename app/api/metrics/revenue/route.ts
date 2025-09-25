import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { envClient } from "@/lib/env.client";
import type { Dayjs } from "dayjs";
import { dayjsTz } from "@/lib/dayjs";
import { fetchPipelines } from "@/lib/kommoData";
import { getLatestKommoConnection } from "@/lib/kommoConnection";
import { computeRevenueMetric } from "@/lib/metrics/revenue";
import { readMetricsCache, writeMetricsCache } from "@/lib/metrics/cache";

const DEFAULT_TTL_MS = 1000 * 60 * 5;
const FORCE_COOLDOWN_MS = 1000 * 60 * 2;
const DEFAULT_TIMEZONE = "UTC";
const DEFAULT_CURRENCY = "BRL";

type ParsedFilters = {
  pipelineIds?: number[];
  userIds?: number[];
  statusIds?: number[];
  stageLabel: string;
  stageRaw: string;
};

type ResolvedRange = {
  currentFrom: Dayjs;
  currentTo: Dayjs;
  previousFrom: Dayjs;
  previousTo: Dayjs;
  label: string;
};

function parseIdList(value: string | null | undefined): number[] | undefined {
  if (!value) {
    return undefined;
  }

  const ids = value
    .split(",")
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isInteger(item));

  return ids.length ? ids : undefined;
}

function resolveRange(
  rangeParam: string | null,
  timezone: string,
  fromParam: string | null,
  toParam: string | null
): ResolvedRange {
  const now = dayjsTz(undefined, timezone);
  let start: Dayjs;
  let end: Dayjs;
  let label: string;

  switch (rangeParam) {
    case "today":
      start = now.startOf("day");
      end = now.endOf("day");
      label = "Hoje";
      break;
    case "7d":
      end = now.endOf("day");
      start = end.subtract(6, "day").startOf("day");
      label = "Ultimos 7 dias";
      break;
    case "30d":
      end = now.endOf("day");
      start = end.subtract(29, "day").startOf("day");
      label = "Ultimos 30 dias";
      break;
    case "quarter":
      end = now.endOf("day");
      start = end.subtract(89, "day").startOf("day");
      label = "Ultimos 90 dias";
      break;
    case "custom":
      if (fromParam && toParam) {
        const customStart = dayjsTz(fromParam, timezone);
        const customEnd = dayjsTz(toParam, timezone);
        if (customStart.isValid() && customEnd.isValid()) {
          start = customStart.startOf("day");
          end = customEnd.endOf("day");
          label = "Personalizado";
          break;
        }
      }
      end = now.endOf("day");
      start = end.subtract(29, "day").startOf("day");
      label = "Ultimos 30 dias";
      break;
    default:
      end = now.endOf("day");
      start = end.subtract(29, "day").startOf("day");
      label = "Ultimos 30 dias";
      break;
  }

  const durationMs = end.valueOf() - start.valueOf();
  const previousTo = start.subtract(1, "millisecond");
  const previousFrom = previousTo.subtract(durationMs, "millisecond");

  return {
    currentFrom: start,
    currentTo: end,
    previousFrom,
    previousTo,
    label,
  };
}

function flattenStatuses(pipelines: Awaited<ReturnType<typeof fetchPipelines>>) {
  return pipelines.flatMap((pipeline) =>
    (pipeline._embedded?.statuses ?? []).map((status) => ({
      id: status.id,
      name: status.name,
      pipelineId: pipeline.id,
      type: status.type,
    }))
  );
}

function resolveStageFilter(
  stageParam: string | null,
  pipelineIds: number[] | undefined,
  pipelines: Awaited<ReturnType<typeof fetchPipelines>>
): ParsedFilters["statusIds"] {
  if (!stageParam || stageParam === "all") {
    return undefined;
  }

  const statuses = flattenStatuses(pipelines);
  const filteredStatuses = pipelineIds?.length
    ? statuses.filter((status) => pipelineIds.includes(status.pipelineId))
    : statuses;

  if (stageParam === "won") {
    return filteredStatuses
      .filter((status) => status.type === 1 || status.id === 142)
      .map((status) => status.id);
  }

  if (stageParam === "lost") {
    return filteredStatuses
      .filter((status) => status.type === 2 || status.id === 143)
      .map((status) => status.id);
  }

  const ids = parseIdList(stageParam);
  if (!ids) {
    return undefined;
  }

  return ids.filter((id) => filteredStatuses.some((status) => status.id === id));
}

function buildStageLabel(stageParam: string | null, filters: ParsedFilters, pipelines: Awaited<ReturnType<typeof fetchPipelines>>) {
  if (!stageParam || stageParam === "all") {
    return "Todas as etapas";
  }

  if (stageParam === "won") {
    return "Fechados (Won)";
  }

  if (stageParam === "lost") {
    return "Perdidos";
  }

  const statuses = flattenStatuses(pipelines);
  if (!filters.statusIds?.length) {
    return "Etapas selecionadas";
  }

  const labels = filters.statusIds
    .map((id) => statuses.find((status) => status.id === id)?.name)
    .filter((label): label is string => Boolean(label));

  return labels.length ? labels.join(", ") : "Etapas selecionadas";
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

  const timezone = connection.metadata.timezone ?? DEFAULT_TIMEZONE;

  try {
    const pipelines = await fetchPipelines(connection.accountDomain, connection.auth);

    const searchParams = request.nextUrl.searchParams;
    const rangeParam = searchParams.get("range");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const forceParam = searchParams.get("force");
    const pipelineParam = searchParams.get("pipelines");
    const stageParam = searchParams.get("stage");
    const userParam = searchParams.get("users");

    const pipelineIds = parseIdList(pipelineParam);
    const userIds = parseIdList(userParam);
    const range = resolveRange(rangeParam, timezone, fromParam, toParam);

    const statusIds = resolveStageFilter(stageParam, pipelineIds, pipelines);

    const filters: ParsedFilters = {
      pipelineIds,
      userIds,
      statusIds,
      stageLabel: "",
      stageRaw: stageParam ?? "all",
    };

    filters.stageLabel = buildStageLabel(stageParam, filters, pipelines);

    const force = forceParam === "1" || forceParam === "true";

    const cacheKeyParts = [
      "revenue",
      timezone,
      `${range.currentFrom.valueOf()}-${range.currentTo.valueOf()}`,
      pipelineIds?.join("-") ?? "all",
      userIds?.join("-") ?? "all",
      filters.statusIds?.join("-") ?? filters.stageRaw,
    ];
    const cacheKey = cacheKeyParts.join(":");

    const cached = await readMetricsCache(user.id, cacheKey, connection.id).catch(() => null);
    const now = Date.now();
    const ttlValid = cached ? Date.parse(cached.ttlExpiresAt) > now : false;

    let cooldownRemainingSeconds = 0;
    let useCache = Boolean(cached && ttlValid && !force);

    if (force && cached) {
      const elapsedMs = now - Date.parse(cached.updatedAt);
      if (elapsedMs < FORCE_COOLDOWN_MS) {
        cooldownRemainingSeconds = Math.ceil((FORCE_COOLDOWN_MS - elapsedMs) / 1000);
        useCache = true;
      }
    }

    let payload: any;
    let cacheHit = false;

    if (useCache && cached) {
      payload = cached.payload;
      cacheHit = true;
    } else {
      payload = await computeRevenueMetric({
        accountDomain: connection.accountDomain,
        auth: connection.auth,
        timezone,
        range,
        filters,
      });

      await writeMetricsCache(user.id, cacheKey, payload, DEFAULT_TTL_MS, connection.id);
    }

    return NextResponse.json({
      data: payload,
      context: {
        timezone,
        currency: DEFAULT_CURRENCY,
        filters,
        range: {
          label: range.label,
          currentFrom: range.currentFrom.toISOString(),
          currentTo: range.currentTo.toISOString(),
          previousFrom: range.previousFrom.toISOString(),
          previousTo: range.previousTo.toISOString(),
        },
      },
      cache: {
        hit: cacheHit,
        cachedAt: cached?.updatedAt ?? null,
        expiresAt: cached?.ttlExpiresAt ?? null,
        forceApplied: force && !cacheHit,
        cooldownRemainingSeconds,
      },
    });
  } catch (error) {
    console.error("Erro ao calcular receita mensal", error);
    return NextResponse.json({ message: "Nao foi possivel calcular a receita." }, { status: 500 });
  }
}


