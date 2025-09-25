"use client";

import { useMemo } from "react";

import type { RevenueMetricResponse } from "@/lib/types/revenue";

type MonthlyRevenueWidgetProps = {
  response: RevenueMetricResponse | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  onSync: () => void;
  cooldownSeconds: number;
  filterSummary: {
    pipeline: string;
    user: string;
  };
};

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function formatDateRangePart(value: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function MonthlyRevenueWidget({
  response,
  loading,
  syncing,
  error,
  onSync,
  cooldownSeconds,
  filterSummary,
}: MonthlyRevenueWidgetProps) {
  const currency = response?.context.currency ?? "BRL";
  const timezone = response?.context.timezone ?? "UTC";

  const sparkline = useMemo(() => {
    if (!response?.data.series.length) {
      return null;
    }

    const series = response.data.series;
    const height = 48;
    const width = 132;
    const max = Math.max(...series.map((point) => point.value), 1);

    if (series.length === 1) {
      const y = height - (series[0].value / max) * height;
      const points = `0,${y.toFixed(2)} ${width},${y.toFixed(2)}`;
      return { width, height, points, lastX: width, lastY: y, max };
    }

    const points = series
      .map((point, index) => {
        const x = (index / (series.length - 1)) * width;
        const y = height - (point.value / max) * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");

    const lastPoint = series[series.length - 1];
    const lastX = width;
    const lastY = height - (lastPoint.value / max) * height;

    return { width, height, points, lastX, lastY, max };
  }, [response]);

  if (loading) {
    return (
      <article className="dashboard-card col-span-1 row-span-1 flex h-full min-w-0 flex-col gap-4">
        <div className="h-3 w-24 rounded bg-[color:var(--surface-strong)]" />
        <div className="h-8 w-3/4 rounded bg-[color:var(--surface-strong)]" />
        <div className="h-2 w-full rounded bg-[color:var(--surface-strong)]" />
        <div className="h-2 w-2/3 rounded bg-[color:var(--surface-strong)]" />
        <div className="h-4 w-1/3 rounded bg-[color:var(--surface-strong)]" />
      </article>
    );
  }

  if (error) {
    return (
      <article className="dashboard-card col-span-1 row-span-1 flex h-full min-w-0 flex-col justify-between gap-4">
        <div>
          <p className="text-sm text-[color:var(--muted)]">Receita</p>
          <p className="mt-2 text-lg text-[color:var(--negative)]">{error}</p>
        </div>
        <button
          onClick={onSync}
          className="inline-flex items-center justify-center self-start rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[color:var(--accent)]/85"
        >
          Tentar novamente
        </button>
      </article>
    );
  }

  if (!response) {
    return (
      <article className="dashboard-card col-span-1 row-span-1 flex h-full min-w-0 flex-col justify-between">
        <p className="text-sm text-[color:var(--muted)]">Receita</p>
        <p className="text-lg text-[color:var(--muted)]">Nenhum dado disponivel.</p>
      </article>
    );
  }

  const { data, context, cache } = response;
  const totalFormatted = formatCurrency(data.total, currency);
  const previousFormatted = formatCurrency(data.previousTotal, currency);
  const diffValue = data.total - data.previousTotal;
  const diffFormatted = formatCurrency(Math.abs(diffValue), currency);
  const trendPercentage = data.trendPercentage;
  const trendLabel =
    trendPercentage === null
      ? "Sem base de comparacao"
      : `${trendPercentage.toFixed(1)}% vs periodo anterior`;
  const trendPrefix = trendPercentage === null ? "" : trendPercentage >= 0 ? "+" : "-";
  const rangeStart = formatDateRangePart(data.range.currentFrom, timezone);
  const rangeEnd = formatDateRangePart(data.range.currentTo, timezone);
  const generatedAt = formatDateTime(data.generatedAt, timezone);

  const syncDisabled = syncing || cooldownSeconds > 0;
  const syncLabel = syncing
    ? "Sincronizando..."
    : cooldownSeconds > 0
    ? `Aguarde ${cooldownSeconds}s`
    : "Sincronizar";

  return (
    <article className="dashboard-card col-span-1 row-span-1 flex h-full min-w-0 flex-col gap-4 overflow-hidden">
      <header className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Receita</p>
          <p className="mt-2 truncate text-3xl font-semibold text-[color:var(--foreground)]">{totalFormatted}</p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">
            Periodo: {rangeStart} - {rangeEnd}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {cache?.hit ? (
            <span className="rounded-full border border-[color:var(--border)] px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Cache
            </span>
          ) : null}
          <button
            onClick={onSync}
            disabled={syncDisabled}
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-3 py-1 text-xs font-medium text-white transition disabled:cursor-not-allowed disabled:bg-[color:var(--border)] disabled:text-[color:var(--muted)]"
          >
            {syncLabel}
          </button>
        </div>
      </header>

      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-2 text-sm">
          {trendPercentage !== null ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                trendPercentage >= 0 ? "text-[color:var(--positive)]" : "text-[color:var(--negative)]"
              }`}
            >
              {trendPrefix} {trendLabel}
            </span>
          ) : (
            <span className="text-xs text-[color:var(--muted)]">{trendLabel}</span>
          )}
          <span className="text-xs text-[color:var(--muted)]">
            Diferenca: {diffValue >= 0 ? "+" : "-"}
            {diffFormatted}
          </span>
        </div>

        {sparkline ? (
          <div className="overflow-hidden">
            <svg
              viewBox={`0 0 ${sparkline.width} ${sparkline.height}`}
              className="h-16 w-full text-[color:var(--accent)]"
              preserveAspectRatio="none"
            >
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                points={sparkline.points}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <circle
                cx={sparkline.lastX}
                cy={sparkline.lastY}
                r="3"
                fill="currentColor"
                stroke="var(--surface)"
                strokeWidth="1"
              />
            </svg>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[color:var(--border)] p-3 text-center text-xs text-[color:var(--muted)]">
            Sem pontos suficientes para exibir tendencia.
          </div>
        )}
      </div>

      <div className="space-y-1 text-xs text-[color:var(--muted)]">
        <p>Comparativo anterior: {previousFormatted}</p>
        <p>Leads: {data.uniqueLeads} (anterior {data.previousUniqueLeads})</p>
        <p>Etapa: {context.filters.stageLabel}</p>
        <p>{filterSummary.pipeline} | {filterSummary.user}</p>
      </div>

      <footer className="mt-auto text-xs text-[color:var(--muted)]">
        Atualizado em {generatedAt}
      </footer>
    </article>
  );
}
