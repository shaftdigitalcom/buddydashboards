import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  KOMMO_TOKEN_SECRET: z.string().min(16),
  KOMMO_CLIENT_ID: z.string().optional(),
  KOMMO_CLIENT_SECRET: z.string().optional(),
  KOMMO_REDIRECT_URI: z.string().url().optional(),
});

const parsed = serverEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  KOMMO_TOKEN_SECRET: process.env.KOMMO_TOKEN_SECRET,
  KOMMO_CLIENT_ID: process.env.KOMMO_CLIENT_ID,
  KOMMO_CLIENT_SECRET: process.env.KOMMO_CLIENT_SECRET,
  KOMMO_REDIRECT_URI: process.env.KOMMO_REDIRECT_URI,
});

if (!parsed.success) {
  console.error("Variáveis de ambiente do servidor inválidas", parsed.error.flatten().fieldErrors);
  throw new Error("Verifique as variáveis de ambiente necessárias no servidor.");
}

export const envServer = parsed.data;
