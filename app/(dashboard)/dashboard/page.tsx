"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MonthlyRevenueWidget } from "@/components/widgets/monthly-revenue";
import type { RevenueMetricResponse } from "@/lib/types/revenue";

type FilterOption = {
  label: string;
  value: string;
};

type DraftFilters = {
  dateRange: string;
  pipeline: string;
  user: string;
  stage: string;
};

type KommoStatusOption = {
  id: number;
  name: string;
  sort: number;
  type: number | null;
  isWon: boolean;
  isLost: boolean;
};

type KommoPipelineOption = {
  id: number;
  name: string;
  isMain: boolean;
  statuses: KommoStatusOption[];
  wonStatusIds: number[];
  lostStatusIds: number[];
};

type KommoUserOption = {
  id: number;
  name: string;
  email: string | null;
  isActive: boolean | null;
};

type KommoOptions = {
  timezone: string;
  pipelines: KommoPipelineOption[];
  users: KommoUserOption[];
  metadata: Record<string, unknown>;
  accountDomain: string;
  updatedAt: string;
};

const DATE_OPTIONS: FilterOption[] = [
  { label: "Hoje", value: "today" },
  { label: "Ultimos 7 dias", value: "7d" },
  { label: "Ultimos 30 dias", value: "30d" },
  { label: "Ultimos 90 dias", value: "quarter" },
];

type SelectProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  disabled?: boolean;
};

function Select({ id, label, value, onChange, options, disabled }: SelectProps) {
  return (
    <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.25em] text-[color:var(--muted)]">
      {label}
      <select
        id={id}
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        disabled={disabled}
        className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm font-normal text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[color:var(--surface)]">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type PlaceholderCardProps = {
  title: string;
  description: string;
};

function PlaceholderCard({ title, description }: PlaceholderCardProps) {
  return (
    <article className="dashboard-card items-center justify-center text-center text-sm text-[color:var(--muted)]">
      <div className="space-y-2">
        <p className="text-base text-[color:var(--foreground)]">{title}</p>
        <p>{description}</p>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const [options, setOptions] = useState<KommoOptions | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [draftFilters, setDraftFilters] = useState<DraftFilters>({
    dateRange: "30d",
    pipeline: "all",
    user: "all",
    stage: "won",
  });
  const [activeFilters, setActiveFilters] = useState<DraftFilters>(draftFilters);

  const [revenueResponse, setRevenueResponse] = useState<RevenueMetricResponse | null>(null);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [syncingRevenue, setSyncingRevenue] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const revenueAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      setOptionsLoading(true);
      setOptionsError(null);
      try {
        const response = await fetch("/api/kommo/options");
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message ?? "Falha ao carregar opcoes");
        }
        const data = (await response.json()) as KommoOptions;
        if (!cancelled) {
          setOptions(data);
        }
      } catch (error) {
        if (!cancelled) {
          setOptionsError("Nao foi possivel carregar os filtros do Kommo.");
        }
      } finally {
        if (!cancelled) {
          setOptionsLoading(false);
        }
      }
    };

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      revenueAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (!options) {
      return;
    }

    if (["won", "lost", "all"].includes(draftFilters.stage)) {
      return;
    }

    const stageId = Number.parseInt(draftFilters.stage, 10);
    if (!Number.isInteger(stageId)) {
      setDraftFilters((prev) => ({ ...prev, stage: "won" }));
      return;
    }

    const pipelinesToSearch =
      draftFilters.pipeline === "all"
        ? options.pipelines
        : options.pipelines.filter((pipeline) => String(pipeline.id) === draftFilters.pipeline);

    const stageExists = pipelinesToSearch.some((pipeline) =>
      pipeline.statuses.some((status) => status.id === stageId)
    );

    if (!stageExists) {
      setDraftFilters((prev) => ({ ...prev, stage: "won" }));
    }
  }, [draftFilters.pipeline, draftFilters.stage, options]);

  const fetchRevenue = useCallback(
    async (force = false) => {
      if (!options) {
        return;
      }

      revenueAbortRef.current?.abort();
      const controller = new AbortController();
      revenueAbortRef.current = controller;

      if (force) {
        setSyncingRevenue(true);
      } else {
        setLoadingRevenue(true);
      }
      setRevenueError(null);

      try {
        const params = new URLSearchParams();
        params.set("range", activeFilters.dateRange);
        if (activeFilters.pipeline !== "all") {
          params.set("pipelines", activeFilters.pipeline);
        }
        if (activeFilters.user !== "all") {
          params.set("users", activeFilters.user);
        }
        if (activeFilters.stage !== "all") {
          params.set("stage", activeFilters.stage);
        }
        if (force) {
          params.set("force", "1");
        }

        const response = await fetch(`/api/metrics/revenue?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message ?? "Falha ao obter receita");
        }

        const data = (await response.json()) as RevenueMetricResponse;
        setRevenueResponse(data);
        setCooldownSeconds(data.cache.cooldownRemainingSeconds ?? 0);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        setRevenueError("Nao foi possivel carregar a receita.");
      } finally {
        if (force) {
          setSyncingRevenue(false);
        }
        setLoadingRevenue(false);
      }
    },
    [activeFilters, options]
  );

  useEffect(() => {
    if (!options) {
      return;
    }

    void fetchRevenue(false);
  }, [options, activeFilters, fetchRevenue]);

  const pipelineSelectOptions = useMemo<FilterOption[]>(() => {
    if (!options) {
      return [{ label: "Todos os pipelines", value: "all" }];
    }

    return [
      { label: "Todos os pipelines", value: "all" },
      ...options.pipelines.map((pipeline) => ({
        label: pipeline.name,
        value: String(pipeline.id),
      })),
    ];
  }, [options]);

  const userSelectOptions = useMemo<FilterOption[]>(() => {
    if (!options) {
      return [{ label: "Todos os usuarios", value: "all" }];
    }

    return [
      { label: "Todos os usuarios", value: "all" },
      ...options.users.map((user) => ({
        label: user.name,
        value: String(user.id),
      })),
    ];
  }, [options]);

  const stageSelectOptions = useMemo<FilterOption[]>(() => {
    const base: FilterOption[] = [
      { label: "Fechados (Won)", value: "won" },
      { label: "Perdidos", value: "lost" },
      { label: "Todas as etapas", value: "all" },
    ];

    if (!options) {
      return base;
    }

    const relevantPipelines =
      draftFilters.pipeline === "all"
        ? options.pipelines
        : options.pipelines.filter((pipeline) => String(pipeline.id) === draftFilters.pipeline);

    const seen = new Set<number>();
    const statusOptions: FilterOption[] = [];

    for (const pipeline of relevantPipelines) {
      for (const status of pipeline.statuses) {
        if (pipeline.wonStatusIds.includes(status.id) || pipeline.lostStatusIds.includes(status.id)) {
          continue;
        }
        if (seen.has(status.id)) {
          continue;
        }
        seen.add(status.id);
        statusOptions.push({
          label: `${pipeline.name} - ${status.name}`,
          value: String(status.id),
        });
      }
    }

    statusOptions.sort((a, b) => a.label.localeCompare(b.label));
    return base.concat(statusOptions);
  }, [draftFilters.pipeline, options]);

  const filtersDirty =
    draftFilters.dateRange !== activeFilters.dateRange ||
    draftFilters.pipeline !== activeFilters.pipeline ||
    draftFilters.user !== activeFilters.user ||
    draftFilters.stage !== activeFilters.stage;

  const pipelineSummary = useMemo(() => {
    if (!options) {
      return "Pipelines indisponiveis";
    }
    if (activeFilters.pipeline === "all") {
      return "Todos os pipelines";
    }
    const pipeline = options.pipelines.find((item) => String(item.id) === activeFilters.pipeline);
    return pipeline ? `Pipeline: ${pipeline.name}` : "Pipeline selecionado";
  }, [activeFilters.pipeline, options]);

  const userSummary = useMemo(() => {
    if (!options) {
      return "Usuarios indisponiveis";
    }
    if (activeFilters.user === "all") {
      return "Todos os usuarios";
    }
    const user = options.users.find((item) => String(item.id) === activeFilters.user);
    return user ? `Usuario: ${user.name}` : "Usuario selecionado";
  }, [activeFilters.user, options]);

  const handleApplyFilters = () => {
    setActiveFilters(draftFilters);
  };

  const handleManualSync = () => {
    if (syncingRevenue || cooldownSeconds > 0) {
      return;
    }
    void fetchRevenue(true);
  };

  const placeholderSlots = useMemo(() => Array.from({ length: 23 }, (_, index) => index), []);

  return (
    <div className="space-y-8 pb-16">
      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">Filtros</p>
            <h2 className="text-2xl font-normal text-[color:var(--foreground)]">
              Ajuste a leitura do seu time
            </h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              onClick={handleApplyFilters}
              disabled={!filtersDirty || optionsLoading || Boolean(optionsError)}
              className="inline-flex items-center justify-center rounded-xl bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-[color:var(--border)] disabled:text-[color:var(--muted)]"
            >
              Aplicar filtros
            </button>
            <button
              onClick={handleManualSync}
              disabled={syncingRevenue || cooldownSeconds > 0 || loadingRevenue}
              className="inline-flex items-center justify-center rounded-xl border border-[color:var(--border)] px-5 py-3 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:cursor-not-allowed disabled:border-[color:var(--border)] disabled:text-[color:var(--muted)]"
            >
              {syncingRevenue ? "Sincronizando..." : cooldownSeconds > 0 ? `Aguarde ${cooldownSeconds}s` : "Sincronizar agora"}
            </button>
          </div>
        </header>

        {optionsError ? (
          <p className="mt-4 text-sm text-[color:var(--negative)]">{optionsError}</p>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <Select
            id="date"
            label="Data"
            value={draftFilters.dateRange}
            onChange={(value) => setDraftFilters((prev) => ({ ...prev, dateRange: value }))}
            options={DATE_OPTIONS}
            disabled={optionsLoading}
          />
          <Select
            id="pipeline"
            label="Pipeline"
            value={draftFilters.pipeline}
            onChange={(value) => setDraftFilters((prev) => ({ ...prev, pipeline: value, stage: "won" }))}
            options={pipelineSelectOptions}
            disabled={optionsLoading || Boolean(optionsError)}
          />
          <Select
            id="user"
            label="Usuario"
            value={draftFilters.user}
            onChange={(value) => setDraftFilters((prev) => ({ ...prev, user: value }))}
            options={userSelectOptions}
            disabled={optionsLoading || Boolean(optionsError)}
          />
          <Select
            id="stage"
            label="Etapa"
            value={draftFilters.stage}
            onChange={(value) => setDraftFilters((prev) => ({ ...prev, stage: value }))}
            options={stageSelectOptions}
            disabled={optionsLoading || Boolean(optionsError)}
          />
        </div>
      </section>

      <section className="dashboard-grid auto-rows-[minmax(140px,1fr)]" style={{ aspectRatio: "16 / 9" }}>
        <MonthlyRevenueWidget
          response={revenueResponse}
          loading={loadingRevenue || optionsLoading}
          syncing={syncingRevenue}
          error={optionsError ?? revenueError}
          onSync={handleManualSync}
          cooldownSeconds={cooldownSeconds}
          filterSummary={{ pipeline: pipelineSummary, user: userSummary }}
        />
        {placeholderSlots.map((slot) => (
          <div key={slot} className="col-span-1 row-span-1">
            <PlaceholderCard title="Widget disponivel" description="Escolha uma metrica para este slot." />
          </div>
        ))}
      </section>
    </div>
  );
}
