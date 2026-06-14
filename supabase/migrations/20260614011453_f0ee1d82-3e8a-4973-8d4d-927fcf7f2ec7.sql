create table if not exists public.ai_influencers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  source_image_url text not null,
  script text not null,
  voice_id text not null default 'spanish_female',
  language text not null default 'es',
  model_id text,
  duration_sec integer,
  provider_request_id text,
  status text not null default 'queued',
  video_url text,
  thumbnail_url text,
  error_message text,
  credits_charged integer not null default 0,
  credit_transaction_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.ai_influencers to authenticated;
grant all on public.ai_influencers to service_role;

alter table public.ai_influencers enable row level security;

create policy "Users view own influencer videos"
  on public.ai_influencers for select to authenticated
  using (auth.uid() = user_id);

create policy "Users create own influencer videos"
  on public.ai_influencers for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own influencer videos"
  on public.ai_influencers for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users delete own influencer videos"
  on public.ai_influencers for delete to authenticated
  using (auth.uid() = user_id);

create trigger ai_influencers_updated_at
  before update on public.ai_influencers
  for each row execute function public.update_updated_at_column();