import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--background)] px-6 py-16">
      <div className="w-full max-w-md space-y-10">
        <div className="space-y-2 text-center">
          <Link href="/" className="inline-flex items-center justify-center">
            <span className="text-sm uppercase tracking-[0.4em] text-[color:var(--muted)]">
              Buddy
            </span>
          </Link>
          <h1 className="text-2xl font-normal text-[color:var(--foreground)]">
            Dashboards para performance em tempo real
          </h1>
        </div>
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
          {children}
        </div>
        <p className="text-center text-sm text-[color:var(--muted)]">
          Ideal para TVs corporativas 16:9. Visual limpo, dados claros.
        </p>
      </div>
    </div>
  );
}
