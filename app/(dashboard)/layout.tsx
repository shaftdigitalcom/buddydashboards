import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[color:var(--background)] px-10 py-8">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-8">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">
              Buddy Dashboards
            </p>
            <h1 className="text-3xl font-normal text-[color:var(--foreground)]">
              Painel de Vendas em Tempo Real
            </h1>
          </div>
          <nav className="flex gap-3 text-xs text-[color:var(--muted)]">
            <Link href="/settings" className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-2">
              Configurações
            </Link>
            <Link href="/onboarding/kommo" className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-2">
              Conexões Kommo
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
