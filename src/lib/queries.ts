import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const productSelect =
  "id, name, slug, price, images, gender, collection, featured, created_at, description, specs, category:categories(name, slug), store:stores(name, slug), variants:product_variants(id, size, stock)";

export type CatalogFilters = { q?: string; category?: string; gender?: string; collection?: string; sort?: string };

async function fetchCatalog(f: CatalogFilters) {
      let q = supabase.from("products").select(productSelect).eq("is_active", true);
      if (f.q) q = q.ilike("name", `%${f.q}%`);
      if (f.gender) q = q.in("gender", [f.gender, "unisex"]);
      if (f.collection) q = q.eq("collection", f.collection);
      if (f.sort === "price-asc") q = q.order("price", { ascending: true });
      else if (f.sort === "price-desc") q = q.order("price", { ascending: false });
      else q = q.order("created_at", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      const rows = data ?? [];
      return f.category ? rows.filter((r) => r.category?.slug === f.category) : rows;
}

export const catalogQuery = (f: CatalogFilters) =>
  queryOptions({ queryKey: ["catalog", f], queryFn: () => fetchCatalog(f) });

export type CatalogProduct = Awaited<ReturnType<typeof fetchCatalog>>[number];

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("id, name, slug").order("name");
    if (error) throw error;
    return data;
  },
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select(productSelect).eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
