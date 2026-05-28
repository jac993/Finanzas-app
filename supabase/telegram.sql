-- Tabla para vincular cada usuario con su chat de Telegram.
-- Ejecuta este SQL en Supabase: Dashboard -> SQL Editor -> New query -> pega y Run.

create table if not exists public.telegram_links (
  user_id uuid primary key references auth.users (id) on delete cascade,
  link_code text unique,
  telegram_chat_id text unique,
  linked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.telegram_links enable row level security;

-- Cada usuario solo puede ver y administrar su propia vinculación.
-- El webhook usa la service_role key, que omite RLS.
drop policy if exists "Users manage own telegram link" on public.telegram_links;

create policy "Users manage own telegram link"
  on public.telegram_links
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
