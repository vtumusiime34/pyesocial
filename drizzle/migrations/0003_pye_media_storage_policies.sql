-- Anyone may read PYE media (videos, posters, avatars, banners, audio).
create policy "pye media readable" on storage.objects for select
  using (bucket_id = 'pye-media');

-- Signed-in users may upload into their own folder: <user-id>/<path>
create policy "pye media upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'pye-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "pye media update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'pye-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "pye media delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'pye-media' and (storage.foldername(name))[1] = auth.uid()::text);