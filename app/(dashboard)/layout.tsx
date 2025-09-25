import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Kommo", href: "/onboarding/kommo" },
  { label: "Configurações", href: "/settings" },
];

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[color:var(--background)] px-8 py-6">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">
              Buddy Dashboards
            </p>
            <h1 className="text-3xl font-normal text-[color:var(--foreground)]">
              Painel de Vendas em Tempo Real
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <nav className="flex flex-wrap gap-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--muted)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <LogoutButton />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
