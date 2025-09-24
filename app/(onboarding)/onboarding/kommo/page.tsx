"use client";

import { useMemo, useState } from "react";

const steps = [
  {
    id: 1,
    title: "Escolher método",
    description: "Defina como vamos autenticar com o Kommo.",
  },
  {
    id: 2,
    title: "Validar credenciais",
    description: "Confirmamos acesso e salvamos de forma segura.",
  },
  {
    id: 3,
    title: "Configurar widgets",
    description: "Ajuste filtros e finalize o dashboard.",
  },
] as const;

type ConnectionMethod = "oauth" | "token";

export default function KommoOnboardingPage() {
  const [method, setMethod] = useState<ConnectionMethod | null>(null);
  const [token, setToken] = useState("");
  const [accountDomain, setAccountDomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeStep = useMemo(() => (method ? 2 : 1), [method]);

  const normalizedDomain = accountDomain.trim().replace(/^https?:\/\//, "");

  const handleStartOAuth = () => {
    setError(null);

    if (!normalizedDomain) {
      setError("Informe o domínio da sua conta Kommo (ex.: empresa.kommo.com).");
      return;
    }

    setIsSubmitting(true);

    try {
      const account = normalizedDomain.replace(/\.kommo\.com$/i, "");
      window.location.href = `/api/kommo/oauth/start?account=${encodeURIComponent(account)}`;
    } catch (err) {
      console.error(err);
      setError("Falha ao iniciar OAuth. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  const handleSubmitToken = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!normalizedDomain) {
      setError("Informe o domínio da sua conta Kommo antes de validar o token.");
      return;
    }

    setIsSubmitting(true);

    try {
      const account = normalizedDomain.replace(/\.kommo\.com$/i, "");
      await fetch("/api/kommo/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, accountDomain: account }),
      });
    } catch (err) {
      console.error(err);
      setError("Não foi possível validar o token. Revise e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <nav className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {steps.map((step) => {
          const isActive = activeStep === step.id;
          const isComplete = activeStep > step.id;
          return (
            <div
              key={step.id}
              className={`rounded-2xl border px-5 py-4 transition ${
                isActive
                  ? "border-[color:var(--accent)]/70 bg-[color:var(--surface-strong)] shadow-[0_25px_60px_rgba(0,0,0,0.25)]"
                  : "border-[color:var(--border)] bg-[color:var(--surface)]"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Passo {step.id}
              </p>
              <p className="mt-2 text-lg font-normal text-[color:var(--foreground)]">
                {step.title}
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{step.description}</p>
              {isComplete ? (
                <p className="mt-3 text-xs text-[color:var(--positive)]">Concluído</p>
              ) : null}
            </div>
          );
        })}
      </nav>

      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 lg:p-8">
        <h2 className="text-lg font-normal text-[color:var(--foreground)]">Domínio da sua conta Kommo</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Informe o endereço usado para acessar o Kommo. Exemplo: <span className="text-[color:var(--foreground)]">suaempresa.kommo.com</span>
        </p>
        <input
          type="text"
          placeholder="suaempresa.kommo.com"
          value={accountDomain}
          onChange={(event) => setAccountDomain(event.target.value)}
          className="mt-4 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/30"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article
          className={`flex h-full flex-col justify-between rounded-3xl border p-8 transition ${
            method === "oauth"
              ? "border-[color:var(--accent)]/70 bg-[color:var(--surface-strong)]"
              : "border-[color:var(--border)] bg-[color:var(--surface)]"
          }`}
        >
          <div className="space-y-4">
            <h2 className="text-xl font-normal text-[color:var(--foreground)]">OAuth recomendado</h2>
            <p className="text-sm text-[color:var(--muted)]">
              Segurança máxima: o usuário é redirecionado ao Kommo, aprova o acesso e voltamos com tokens individuais.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[color:var(--muted)]">
              <li>Renovação automática de tokens (refresh).</li>
              <li>Permissões sempre alinhadas ao Kommo.</li>
              <li>Nenhum token visível para o time Buddy.</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => {
              setMethod("oauth");
              handleStartOAuth();
            }}
            disabled={isSubmitting}
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[color:var(--accent)]/85 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && method === "oauth" ? "Abrindo Kommo..." : "Conectar via OAuth"}
          </button>
        </article>

        <article
          className={`flex h-full flex-col justify-between rounded-3xl border p-8 transition ${
            method === "token"
              ? "border-[color:var(--accent)]/70 bg-[color:var(--surface-strong)]"
              : "border-[color:var(--border)] bg-[color:var(--surface)]"
          }`}
        >
          <div className="space-y-4">
            <h2 className="text-xl font-normal text-[color:var(--foreground)]">Token de longa duração</h2>
            <p className="text-sm text-[color:var(--muted)]">
              Cole um token gerado no Kommo. Guardaremos criptografado e você pode trocar quando quiser.
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-[color:var(--muted)]">
              <li>No Kommo, acesse Configurações &gt; API.</li>
              <li>Gere um token de longa duração com permissões de leitura.</li>
              <li>Cole abaixo e valide.</li>
            </ol>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmitToken}>
            <label className="flex flex-col space-y-2 text-sm">
              <span className="text-[color:var(--muted)]">Token Kommo</span>
              <textarea
                required
                value={token}
                onChange={(event) => {
                  setMethod("token");
                  setToken(event.target.value);
                }}
                rows={4}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/30"
                placeholder="Cole o token completo aqui"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting || !token.trim()}
              className="inline-flex w-full items-center justify-center rounded-xl border border-[color:var(--accent)] px-5 py-3 text-sm font-medium text-[color:var(--accent)] transition hover:bg-[color:var(--accent)]/10 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting && method === "token" ? "Validando..." : "Validar token"}
            </button>
          </form>
        </article>
      </section>

      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 lg:p-8">
        <h3 className="text-lg font-normal text-[color:var(--foreground)]">O que acontece depois?</h3>
        <div className="mt-3 grid gap-4 text-sm text-[color:var(--muted)] lg:grid-cols-3">
          <p>
            Validamos seu acesso ao Kommo, incluindo pipelines e usuários. Tudo fica salvo com segurança via Supabase e criptografia.
          </p>
          <p>
            Montamos a base para o dashboard: eventos de etapas, leads e métricas iniciais ficam em cache para carregamento rápido.
          </p>
          <p>
            Você ajusta filtros, define quais widgets ocuparão o grid 6x4 e transmite na TV em tempo real.
          </p>
        </div>
      </section>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}


