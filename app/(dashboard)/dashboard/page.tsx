const FILTER_OPTIONS = {
  date: [
    { label: "Hoje", value: "today" },
    { label: "Últimos 7 dias", value: "7d" },
    { label: "Últimos 30 dias", value: "30d" },
    { label: "Esse trimestre", value: "quarter" }
  ],
  pipeline: [
    { label: "Todos", value: "all" }
  ],
  user: [
    { label: "Todos", value: "all" }
  ],
  stage: [
    { label: "Todas", value: "all" }
  ]
} as const;

const placeholders = [
  { title: "Widget disponível", description: "Escolha uma métrica para este slot." },
  { title: "Widget disponível", description: "Monte indicadores personalizados." },
  { title: "Widget disponível", description: "Integre dados externos futuramente." },
  { title: "Widget disponível", description: "Arraste e solte em breve." },
];

function Select({
  id,
  label,
  options,
}: {
  id: string;
  label: string;
  options: ReadonlyArray<{ label: string; value: string }>;
}) {
  return (
    <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.25em] text-[color:var(--muted)]">
      {label}
      <select
        id={id}
        defaultValue={options[0]?.value}
        className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm font-normal text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/30"
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

function StatCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper?: string;
}) {
  return (
    <article className="dashboard-card">
      <div className="space-y-3">
        <p className="text-sm text-[color:var(--muted)]">{title}</p>
        <p className="text-4xl font-normal tracking-tight text-[color:var(--foreground)]">
          {value}
        </p>
      </div>
      {helper ? (
        <p className="text-xs uppercase tracking-widest text-[color:var(--muted)]">{helper}</p>
      ) : null}
    </article>
  );
}

function PlaceholderCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="dashboard-card items-center justify-center text-center text-sm text-[color:var(--muted)]">
      <div className="space-y-2">
        <p className="text-base text-[color:var(--foreground)]">{title}</p>
        <p>{description}</p>
      </div>
      <button className="mt-6 inline-flex items-center justify-center rounded-full border border-dashed border-[color:var(--border)] px-4 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--muted)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
        + adicionar
      </button>
    </article>
  );
}

function PipelineChart() {
  return (
    <article className="dashboard-card">
      <header className="flex items-center justify-between">
        <p className="text-sm text-[color:var(--muted)]">Vendas por pipeline</p>
        <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)]">
          Exemplo estático
        </span>
      </header>
      <div className="mt-6 space-y-4">
        {["Vendas Principais", "Novos Leads", "Clientes Existentes"].map((label, index) => (
          <div key={label} className="space-y-2">
            <div className="flex items-center justify-between text-sm text-[color:var(--muted)]">
              <span>{label}</span>
              <span>R$ 0</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--surface-strong)]">
              <div
                className={`h-full rounded-full ${
                  index === 0
                    ? "bg-[color:var(--accent)]"
                    : index === 1
                    ? "bg-[color:var(--positive)]"
                    : "bg-[color:var(--negative)]"
                }`}
                style={{ width: `${(index + 1) * 20}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function ActivityList() {
  const items = [
    { title: "Deal fechado com Empresa ABC", detail: "Ana Silva · há 15 min" },
    { title: "Novo lead: Tecnologia XYZ", detail: "Carlos Santos · há 32 min" },
    { title: "Proposta atualizada · Cliente Premium", detail: "Maria Oliveira · há 1h" },
    { title: "Ligação agendada com StartupBR", detail: "Ana Silva · há 2h" }
  ];

  return (
    <article className="dashboard-card">
      <header className="flex items-center justify-between">
        <p className="text-sm text-[color:var(--muted)]">Atividade recente</p>
        <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)]">
          Placeholder
        </span>
      </header>
      <ul className="mt-6 space-y-4 text-sm">
        {items.map((item) => (
          <li key={item.title} className="rounded-xl bg-[color:var(--surface-strong)] px-4 py-3">
            <p className="text-[color:var(--foreground)]">{item.title}</p>
            <p className="text-xs text-[color:var(--muted)]">{item.detail}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8 pb-16">
      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">
              Filtros
            </p>
            <h2 className="text-2xl font-normal text-[color:var(--foreground)]">
              Ajuste a leitura do seu time
            </h2>
          </div>
          <button className="inline-flex items-center justify-center rounded-xl bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[color:var(--accent)]/85">
            Aplicar filtros
          </button>
        </header>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <Select id="date" label="Data" options={FILTER_OPTIONS.date} />
          <Select id="pipeline" label="Pipeline" options={FILTER_OPTIONS.pipeline} />
          <Select id="user" label="Usuário" options={FILTER_OPTIONS.user} />
          <Select id="stage" label="Etapa" options={FILTER_OPTIONS.stage} />
        </div>
      </section>

      <section
        className="dashboard-grid auto-rows-[minmax(140px,1fr)]"
        style={{ aspectRatio: "16 / 9" }}
      >
        <div className="col-span-3 row-span-2">
          <StatCard title="Vendas totais" value="R$ 0" helper="Dados exemplo" />
        </div>
        <div className="col-span-3 row-span-2">
          <PipelineChart />
        </div>
        <div className="col-span-2 row-span-2">
          <StatCard title="Meta mensal" value="R$ 0" helper="Em breve: progresso vs meta" />
        </div>
        <div className="col-span-2 row-span-2">
          <StatCard title="Leads ativos" value="0" helper="Atualização automática a cada 60s" />
        </div>
        <div className="col-span-2 row-span-2">
          <StatCard title="Taxa de conversão" value="0%" helper="Leads que passaram na etapa" />
        </div>
        <div className="col-span-3 row-span-2">
          <ActivityList />
        </div>
        {placeholders.map((placeholder, index) => (
          <div key={index} className="col-span-1 row-span-1">
            <PlaceholderCard title={placeholder.title} description={placeholder.description} />
          </div>
        ))}
      </section>
    </div>
  );
}
