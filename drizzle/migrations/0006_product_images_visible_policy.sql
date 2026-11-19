CREATE OR REPLACE FUNCTION public.product_image_visible(_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id::text = split_part(_name,'/',1) AND role = 'admin')
      OR EXISTS (SELECT 1 FROM public.stores WHERE owner_id::text = split_part(_name,'/',1) AND status = 'verified')
$$;
GRANT EXECUTE ON FUNCTION public.product_image_visible(text) TO anon, authenticated;
DROP POLICY IF EXISTS "read published product images" ON storage.objects;
CREATE POLICY "read published product images" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'product-images' AND public.product_image_visible(name));