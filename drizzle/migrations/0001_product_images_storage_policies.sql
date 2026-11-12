
create policy "read product images" on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
create policy "upload own product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
