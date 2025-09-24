import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  KOMMO_CLIENT_ID: z.string().optional(),
  KOMMO_CLIENT_SECRET: z.string().optional(),
  KOMMO_REDIRECT_URI: z.string().url().optional(),
});

const envResult = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  KOMMO_CLIENT_ID: process.env.KOMMO_CLIENT_ID,
  KOMMO_CLIENT_SECRET: process.env.KOMMO_CLIENT_SECRET,
  KOMMO_REDIRECT_URI: process.env.KOMMO_REDIRECT_URI,
});

if (!envResult.success) {
  console.error("Variáveis de ambiente inválidas", envResult.error.flatten().fieldErrors);
  throw new Error("Verifique as variáveis de ambiente necessárias.");
}

export const env = envResult.data;
