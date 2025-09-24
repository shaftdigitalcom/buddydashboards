"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // TODO: integrar com Supabase Auth + criação de perfil
    } catch (err) {
      setError("Não foi possível criar a conta. Tente novamente.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <h2 className="text-xl font-normal text-[color:var(--foreground)]">
          Comece em minutos
        </h2>
        <p className="text-sm text-[color:var(--muted)]">
          Cadastre-se para conectar seu Kommo e visualizar métricas em TVs corporativas.
        </p>
      </div>

      <div className="space-y-4">
        <label className="flex flex-col space-y-2 text-sm">
          <span className="text-[color:var(--muted)]">Nome</span>
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/30"
            placeholder="Seu nome completo"
          />
        </label>

        <label className="flex flex-col space-y-2 text-sm">
          <span className="text-[color:var(--muted)]">E-mail</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/30"
            placeholder="nome@empresa.com"
          />
        </label>

        <label className="flex flex-col space-y-2 text-sm">
          <span className="text-[color:var(--muted)]">Senha</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/30"
            placeholder="Crie uma senha forte"
          />
        </label>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-xl bg-[color:var(--accent)] px-4 py-3 text-sm font-medium text-white transition hover:bg-[color:var(--accent)]/85 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Criando conta..." : "Criar conta"}
      </button>

      <p className="text-center text-sm text-[color:var(--muted)]">
        Já tem uma conta?{" "}
        <Link href="/login" className="text-[color:var(--accent)] hover:underline">
          Fazer login
        </Link>
      </p>
    </form>
  );
}
