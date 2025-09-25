"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({ id: user.id, full_name: name });

        if (profileError) {
          console.error(profileError);
          setError("Perfil criado parcialmente. Tente salvar novamente nas configurações.");
          return;
        }
      }

      router.push("/onboarding/kommo");
    } catch (err) {
      console.error(err);
      setError("Não foi possível criar a conta. Tente novamente.");
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
