-- Buddy Dashboards core schema
-- Execute no Supabase SQL Editor (preferencialmente em uma única transação)

-- Extensões úteis
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Função para atualizar coluna updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql security definer;

-- Perfis de usuário
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "Selecionar próprio perfil" on public.profiles
  for select using (auth.uid() = id);

create policy "Inserir próprio perfil" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Atualizar próprio perfil" on public.profiles
  for update using (auth.uid() = id);

-- Conexões Kommo por usuário
create table if not exists public.kommo_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_domain text not null,
  auth_type text not null check (auth_type in ('oauth', 'token')),
  access_token_encrypted bytea,
  refresh_token_encrypted bytea,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists kommo_connections_user_account_idx
  on public.kommo_connections(user_id, account_domain);

create trigger set_kommo_connections_updated_at
before update on public.kommo_connections
for each row execute function public.set_updated_at();

alter table public.kommo_connections enable row level security;

create policy "Usuário gerencia suas conexões"
  on public.kommo_connections
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Widgets posicionados no grid 6x4
create table if not exists public.widgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  position int not null check (position between 0 and 23),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists widgets_user_position_idx
  on public.widgets(user_id, position);

create trigger set_widgets_updated_at
before update on public.widgets
for each row execute function public.set_updated_at();

alter table public.widgets enable row level security;

create policy "Usuário gerencia seus widgets"
  on public.widgets
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Eventos de passagem de lead por etapa
create table if not exists public.lead_stage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid references public.kommo_connections(id) on delete cascade,
  lead_id text not null,
  pipeline_id text not null,
  stage_id text not null,
  entered_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists lead_stage_events_lookup_idx
  on public.lead_stage_events (user_id, pipeline_id, stage_id, entered_at desc);

alter table public.lead_stage_events enable row level security;

create policy "Usuário lê seus eventos" on public.lead_stage_events
  using (auth.uid() = user_id);

create policy "Usuário insere seus eventos" on public.lead_stage_events
  for insert with check (auth.uid() = user_id);

-- Cache de métricas agregadas
create table if not exists public.metrics_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid references public.kommo_connections(id) on delete cascade,
  cache_key text not null,
  payload jsonb not null,
  ttl_expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists metrics_cache_user_key_idx
  on public.metrics_cache(user_id, cache_key);

create index if not exists metrics_cache_ttl_idx
  on public.metrics_cache(ttl_expires_at);

create trigger set_metrics_cache_updated_at
before update on public.metrics_cache
for each row execute function public.set_updated_at();

alter table public.metrics_cache enable row level security;

create policy "Usuário gerencia seu cache"
  on public.metrics_cache
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Views/helpers poderão ser adicionadas depois (ex.: materiais agregados)
