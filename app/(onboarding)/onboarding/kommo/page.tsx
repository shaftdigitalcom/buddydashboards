"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const steps = [
  {
    id: 1,
    title: "Informar domínio",
    description: "Precisamos saber qual conta do Kommo conectar.",
  },
  {
    id: 2,
    title: "Validar token",
    description: "Confirmamos acesso com um token de longa duração.",
  },
  {
    id: 3,
    title: "Configurar widgets",
    description: "Ajuste filtros e finalize o dashboard.",
  },
] as const;

type ConnectionMethod = "token";

type ConnectionStatus =
  | { connected: false }
  | {
      connected: true;
      accountDomain: string;
      updatedAt?: string;
      metadata?: Record<string, unknown> | null;
    };

function KommoForm() {
  const [method] = useState<ConnectionMethod>("token");
  const [token, setToken] = useState("");
  const [accountDomain, setAccountDomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [showForm, setShowForm] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch("/api/kommo/status", {
          method: "GET",
          signal: controller.signal,
        });
        if (response.status === 401) {
          setStatus({ connected: false });
          return;
        }
        const body = await response.json();
        setStatus(body.connected ? body : { connected: false });
        if (body.connected) {
          setAccountDomain(`${body.accountDomain}.kommo.com`);
        }
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") {
          return;
        }
        console.error("Erro ao buscar status Kommo", fetchError);
        setStatus({ connected: false });
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (status?.connected) {
      setShowForm(false);
    }
  }, [status]);

  const normalizedDomain = accountDomain.trim().replace(/^https?:\/\//, "");

  const activeStep = useMemo(() => {
    if (status?.connected) {
      return 3;
    }
    return normalizedDomain ? 2 : 1;
  }, [status, normalizedDomain]);

  const handleSubmitToken = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!normalizedDomain) {
      setError("Informe o domínio da sua conta Kommo antes de validar o token.");
      return;
    }

    setIsSubmitting(true);

    try {
      const account = normalizedDomain.replace(/\.kommo\.com$/i, "");
      const response = await fetch("/api/kommo/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, accountDomain: account }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(body?.message ?? "Não foi possível validar o token. Tente novamente.");
        return;
      }

      setSuccess("Conexão validada! Preparando dashboard...");
      setStatus({ connected: true, accountDomain: account, metadata: body?.account ?? null });
      setTimeout(() => router.push("/dashboard?kommo=connected"), 1200);
    } catch (submissionError) {
      console.error(submissionError);
      setError("Não foi possível validar o token. Revise e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatus = () => {
    if (!status?.connected) {
      return null;
    }

    return (
      <section className="grid gap-4 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 lg:grid-cols-2 lg:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">
            Conexão ativa
          </p>
          <h2 className="text-2xl font-normal text-[color:var(--foreground)]">
            {status.accountDomain}.kommo.com
          </h2>
          <p className="text-sm text-[color:var(--muted)]">
            Tudo certo! Este token alimenta o dashboard em tempo real.
          </p>
          <div className="flex flex-wrap gap-3 pt-2 text-xs text-[color:var(--muted)]">
            {status.updatedAt ? (
              <span className="rounded-full border border-[color:var(--border)] px-3 py-1">
                Atualizado: {new Date(status.updatedAt).toLocaleString("pt-BR")}
              </span>
            ) : null}
            <span className="rounded-full border border-[color:var(--border)] px-3 py-1">
              Método: Token de Longa Duração
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[color:var(--accent)]/85"
          >
            Ir para o dashboard
          </Link>
          <button
            type="button"
            onClick={() => {
              setShowForm((previous) => !previous);
              setSuccess(null);
              setError(null);
            }}
            className="inline-flex items-center justify-center rounded-xl border border-[color:var(--border)] px-5 py-3 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
          >
            {showForm ? "Cancelar troca de token" : "Trocar token"}
          </button>
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-10">
      <nav className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {steps.map((step) => {
          const isActive = activeStep >= step.id;
          const isComplete = activeStep > step.id || (step.id === 3 && status?.connected);
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

      {renderStatus()}

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
          disabled={status?.connected && !showForm}
        />
      </section>

      {(!status?.connected || showForm) && (
        <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8">
          <div className="space-y-4">
            <h2 className="text-xl font-normal text-[color:var(--foreground)]">Token de longa duração</h2>
            <p className="text-sm text-[color:var(--muted)]">
              Gere um token em <strong>Configurações → API</strong> dentro do Kommo com permissões de leitura dos pipelines/leads. Cole-o abaixo e valide.
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-[color:var(--muted)]">
              <li>Acesse o Kommo com uma conta com acesso às vendas.</li>
              <li>Crie um token de longa duração.</li>
              <li>Volte aqui, cole o token e clique em validar.</li>
            </ol>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmitToken}>
            <label className="flex flex-col space-y-2 text-sm">
              <span className="text-[color:var(--muted)]">Token Kommo</span>
              <textarea
                required
                value={token}
                onChange={(event) => setToken(event.target.value)}
                rows={5}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/30"
                placeholder="Cole o token completo aqui"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting || !token.trim()}
              className="inline-flex w-full items-center justify-center rounded-xl border border-[color:var(--accent)] px-5 py-3 text-sm font-medium text-[color:var(--accent)] transition hover:bg-[color:var(--accent)]/10 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Validando..." : "Validar token"}
            </button>
          </form>
        </section>
      )}

      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 lg:p-8">
        <h3 className="text-lg font-normal text-[color:var(--foreground)]">O que acontece depois?</h3>
        <div className="mt-3 grid gap-4 text-sm text-[color:var(--muted)] lg:grid-cols-3">
          <p>
            Validamos seu acesso ao Kommo, incluindo pipelines e usuários. Tudo fica salvo com segurança via criptografia local.
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
      {success ? <p className="text-sm text-[color:var(--positive)]">{success}</p> : null}
    </div>
  );
}

export default function KommoOnboardingPage() {
  return (
    <Suspense>
      <KommoForm />
    </Suspense>
  );
}
