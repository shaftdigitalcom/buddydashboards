export default function OnboardingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[color:var(--background)] px-8 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">
            Buddy Dashboards
          </p>
          <h1 className="text-3xl font-normal text-[color:var(--foreground)]">
            Conecte sua conta Kommo
          </h1>
          <p className="text-sm text-[color:var(--muted)]">
            Em poucos passos, os dados do seu CRM irão alimentar os widgets em tempo real.
          </p>
        </header>
        {children}
      </div>
    </div>
  );
}
