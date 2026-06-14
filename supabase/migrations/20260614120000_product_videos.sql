-- Product Videos (Higgsfield IA)
create table public.product_videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  source_image_url text not null,
  prompt text not null,
  style text not null default 'showcase',
  model_id text not null default 'higgsfield-ai/dop/standard',
  duration_sec integer not null default 5,
  aspect_ratio text not null default '9:16',
  provider_request_id text,
  status text not null default 'queued',
  video_url text,
  thumbnail_url text,
  credits_charged integer not null default 0,
  credit_transaction_id uuid,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_videos_user_idx on public.product_videos(user_id, created_at desc);
create index product_videos_status_idx on public.product_videos(status) where status in ('queued','in_progress');

grant select, insert, update, delete on public.product_videos to authenticated;
grant all on public.product_videos to service_role;

alter table public.product_videos enable row level security;

create policy "Users can view own videos" on public.product_videos
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own videos" on public.product_videos
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own videos" on public.product_videos
  for update to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own videos" on public.product_videos
  for delete to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all videos" on public.product_videos
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role) or public.has_role(auth.uid(), 'super_admin'::app_role));

create trigger product_videos_updated_at
  before update on public.product_videos
  for each row execute function public.update_updated_at_column();

-- Public bucket for finished videos
insert into storage.buckets (id, name, public)
values ('product-videos', 'product-videos', true)
on conflict (id) do nothing;

create policy "Public read product-videos"
  on storage.objects for select
  using (bucket_id = 'product-videos');

create policy "Service role can upload product-videos"
  on storage.objects for insert to service_role
  with check (bucket_id = 'product-videos');
