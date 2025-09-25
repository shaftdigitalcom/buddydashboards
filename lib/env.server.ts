import { z } from "zod";

const NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env["buddy_NEXT_PUBLIC_SUPABASE_URL"];
const NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env["buddy_NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env["buddy_SUPABASE_SERVICE_ROLE_KEY"];
const KOMMO_TOKEN_SECRET =
  process.env.KOMMO_TOKEN_SECRET ?? process.env["buddy_KOMMO_TOKEN_SECRET"];

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  KOMMO_TOKEN_SECRET: z.string().min(16),
});

const parsed = serverEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  KOMMO_TOKEN_SECRET,
});

if (!parsed.success) {
  console.error("Variáveis de ambiente do servidor inválidas", parsed.error.flatten().fieldErrors);
  throw new Error("Verifique as variáveis de ambiente necessárias no servidor.");
}

export const envServer = parsed.data;
