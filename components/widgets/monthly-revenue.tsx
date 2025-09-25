"use client";

import { Fragment, useId, useMemo } from "react";

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
  const gradientId = useId();
  const currency = response?.context.currency ?? "BRL";
  const timezone = response?.context.timezone ?? "America/Sao_Paulo";

  const sparkline = useMemo(() => {
    if (!response?.data.series.length) {
      return null;
    }

    const series = response.data.series;
    const height = 56;
    const width = Math.max(series.length * 32, 240);
    const paddingY = 6;
    const values = series.map((point) => point.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = Math.max(maxValue - minValue, 1);

    const coordinates = series.map((point, index) => {
      const x = series.length === 1 ? width / 2 : (index / (series.length - 1)) * width;
      const ratio = (point.value - minValue) / range;
      const y = paddingY + (1 - ratio) * (height - paddingY * 2);
      return { x, y };
    });

    if (!coordinates.length) {
      return null;
    }

    const linePoints = coordinates
      .map((coord) => `${coord.x.toFixed(2)},${coord.y.toFixed(2)}`)
      .join(" ");

    const areaPath = [
      `M0,${height.toFixed(2)}`,
      ...coordinates.map((coord) => `L${coord.x.toFixed(2)},${coord.y.toFixed(2)}`),
      `L${width.toFixed(2)},${height.toFixed(2)}`,
      "Z",
    ].join(" ");

    const lastCoord = coordinates[coordinates.length - 1];

    return {
      width,
      height,
      linePoints,
      areaPath,
      lastX: lastCoord.x,
      lastY: lastCoord.y,
    };
  }, [response]);

  if (loading) {
    return (
      <article className="dashboard-card col-span-2 row-span-1 flex h-full min-w-0 flex-col gap-4">
        <div className="h-3 w-24 rounded bg-[color:var(--surface-strong)]" />
        <div className="h-8 w-1/2 rounded bg-[color:var(--surface-strong)]" />
        <div className="h-16 w-full rounded bg-[color:var(--surface-strong)]" />
        <div className="h-24 w-full rounded bg-[color:var(--surface-strong)]" />
      </article>
    );
  }

  if (error) {
    return (
      <article className="dashboard-card col-span-2 row-span-1 flex h-full min-w-0 flex-col justify-between gap-4">
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
      <article className="dashboard-card col-span-2 row-span-1 flex h-full min-w-0 flex-col justify-between">
        <p className="text-sm text-[color:var(--muted)]">Receita</p>
        <p className="text-lg text-[color:var(--muted)]">Nenhum dado disponivel.</p>
      </article>
    );
  }

  const { data, context } = response;
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

  const detailRows = [
    { label: "Comparativo anterior", value: previousFormatted },
    {
      label: "Leads",
      value: `${data.uniqueLeads} (anterior ${data.previousUniqueLeads})`,
    },
    { label: "Etapa", value: context.filters.stageLabel },
    { label: "Pipeline", value: filterSummary.pipeline },
    { label: "Usuario", value: filterSummary.user },
  ];

  return (
    <article className="dashboard-card col-span-2 row-span-1 flex h-full min-w-0 flex-col gap-5 overflow-hidden">
      <header className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Receita</p>
          <p className="mt-2 text-4xl font-semibold leading-tight text-[color:var(--foreground)] md:text-5xl">
            {totalFormatted}
          </p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">
            Periodo: {rangeStart} - {rangeEnd}
          </p>
        </div>
        <button
          onClick={onSync}
          disabled={syncDisabled}
          className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-4 py-1.5 text-xs font-medium text-white transition disabled:cursor-not-allowed disabled:bg-[color:var(--border)] disabled:text-[color:var(--muted)]"
        >
          {syncLabel}
        </button>
      </header>

      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline gap-3 text-sm">
          {trendPercentage !== null ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
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
              className="h-20 w-full text-[color:var(--accent)]"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={`${gradientId}-area`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={sparkline.areaPath} fill={`url(#${gradientId}-area)`} stroke="none" />
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                points={sparkline.linePoints}
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

      <div className="rounded-2xl border border-[color:var(--border)]/60 bg-[color:var(--surface-strong)]/40 p-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          {detailRows.map((row) => (
            <Fragment key={row.label}>
              <span className="text-[color:var(--muted)]">{row.label}</span>
              <span className="text-right text-[color:var(--foreground)]">{row.value}</span>
            </Fragment>
          ))}
        </div>
      </div>

      <footer className="mt-auto text-xs text-[color:var(--muted)]">
        Atualizado em {generatedAt}
      </footer>
    </article>
  );
}
