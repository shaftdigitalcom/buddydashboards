-- Buddy Dashboards core schema (token Kommo)
-- Execute no Supabase SQL Editor

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql security definer;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Selecionar próprio perfil" on public.profiles;
create policy "Selecionar próprio perfil" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Inserir próprio perfil" on public.profiles;
create policy "Inserir próprio perfil" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Atualizar próprio perfil" on public.profiles;
create policy "Atualizar próprio perfil" on public.profiles
  for update using (auth.uid() = id);

create table if not exists public.kommo_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_domain text not null,
  auth_type text not null default 'token',
  access_token_encrypted bytea,
  refresh_token_encrypted bytea,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists kommo_connections_user_account_idx
  on public.kommo_connections(user_id, account_domain);

drop trigger if exists set_kommo_connections_updated_at on public.kommo_connections;
create trigger set_kommo_connections_updated_at
before update on public.kommo_connections
for each row execute function public.set_updated_at();

alter table public.kommo_connections enable row level security;

drop policy if exists "Usuário gerencia suas conexões" on public.kommo_connections;
create policy "Usuário gerencia suas conexões"
  on public.kommo_connections
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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

drop trigger if exists set_widgets_updated_at on public.widgets;
create trigger set_widgets_updated_at
before update on public.widgets
for each row execute function public.set_updated_at();

alter table public.widgets enable row level security;

drop policy if exists "Usuário gerencia seus widgets" on public.widgets;
create policy "Usuário gerencia seus widgets"
  on public.widgets
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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

drop trigger if exists set_lead_stage_events_updated_at on public.lead_stage_events;
create trigger set_lead_stage_events_updated_at
before update on public.lead_stage_events
for each row execute function public.set_updated_at();

alter table public.lead_stage_events enable row level security;

drop policy if exists "Usuário lê seus eventos" on public.lead_stage_events;
create policy "Usuário lê seus eventos" on public.lead_stage_events
  using (auth.uid() = user_id);

drop policy if exists "Usuário insere seus eventos" on public.lead_stage_events;
create policy "Usuário insere seus eventos" on public.lead_stage_events
  for insert with check (auth.uid() = user_id);

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

drop trigger if exists set_metrics_cache_updated_at on public.metrics_cache;
create trigger set_metrics_cache_updated_at
before update on public.metrics_cache
for each row execute function public.set_updated_at();

alter table public.metrics_cache enable row level security;

drop policy if exists "Usuário gerencia seu cache" on public.metrics_cache;
create policy "Usuário gerencia seu cache"
  on public.metrics_cache
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
