DROP POLICY IF EXISTS "settings public" ON public.platform_settings;
CREATE POLICY "admin reads settings" ON public.platform_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
REVOKE SELECT ON public.platform_settings FROM anon;

DROP POLICY IF EXISTS "categories public" ON public.categories;
CREATE POLICY "categories public" ON public.categories FOR SELECT TO anon, authenticated USING (length(slug) > 0);

DROP POLICY IF EXISTS "read product images" ON storage.objects;
CREATE POLICY "read product images" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-images' AND ((storage.foldername(name))[1] = (select auth.uid()::text) OR public.has_role(auth.uid(), 'admin'::app_role)));