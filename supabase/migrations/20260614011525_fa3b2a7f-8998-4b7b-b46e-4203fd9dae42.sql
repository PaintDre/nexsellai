create policy "Users read own ai-influencers files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ai-influencers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users insert own ai-influencers files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ai-influencers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own ai-influencers files"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'ai-influencers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own ai-influencers files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ai-influencers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

alter table public.ai_influencers add column if not exists storage_path text;