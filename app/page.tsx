import Link from "next/link";

const features = [
  {
    title: "Dashboard 6x4 para TVs",
    description: "Layout desenhado para 16:9 com contraste perfeito e fontes legíveis.",
  },
  {
    title: "Integração Kommo",
    description: "Conecte via OAuth ou token de longa duração. Cada usuário gerencia suas credenciais.",
  },
  {
    title: "Atualização em tempo real",
    description: "Cache inteligente + Supabase Realtime para métricas sempre frescas.",
  },
];

const steps = [
  "Cadastre ou faça login",
  "Conecte seu Kommo",
  "Envie para a TV e acompanhe o time",
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-8 py-16">
      <section className="space-y-10">
        <div className="space-y-6 text-left">
          <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">
            Buddy Dashboards
          </span>
          <h1 className="max-w-3xl text-5xl font-normal leading-tight text-[color:var(--foreground)]">
            Inteligência de vendas em tempo real para TVs corporativas
          </h1>
          <p className="max-w-2xl text-base text-[color:var(--muted)]">
            Conecte sua conta Kommo CRM e exiba indicadores críticos em um grid 6x4, perfeito para salas de operação. Foco absoluto em simplicidade e leitura.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-[color:var(--accent)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[color:var(--accent)]/85"
            >
              Criar conta
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-[color:var(--border)] px-6 py-3 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            >
              Já tenho acesso
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
              <h2 className="text-lg font-normal text-[color:var(--foreground)]">{feature.title}</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <h2 className="text-lg font-normal text-[color:var(--foreground)]">Como funciona</h2>
        <ol className="mt-4 grid gap-4 text-sm text-[color:var(--muted)] sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
              <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                Passo {index + 1}
              </span>
              <p className="mt-2 text-[color:var(--foreground)]">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
