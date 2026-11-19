import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { clearCatalogCache, fetchCachedCatalog } from "@/lib/catalog-cache";

export const productSelect =
  "id, name, slug, price, images, gender, collection, featured, created_at, description, specs, category:categories(name, slug), store:stores(name, slug), variants:product_variants(id, size, stock)";

export type CatalogFilters = {
  q?: string | undefined;
  category?: string | undefined;
  gender?: string | undefined;
  collection?: string | undefined;
  sort?: string | undefined;
  size?: string | undefined;
  inStock?: boolean | string | undefined;
  priceRange?: string | undefined;
  minPrice?: number | string | undefined;
  maxPrice?: number | string | undefined;
};

async function fetchCatalogFromDatabase(f: CatalogFilters) {
  let q = supabase.from("products").select(productSelect).eq("is_active", true);
  if (f.q) q = q.ilike("name", `%${f.q}%`);
  if (f.gender) q = q.in("gender", [f.gender, "unisex"]);
  if (f.collection) q = q.eq("collection", f.collection);
  if (f.sort === "price-asc") q = q.order("price", { ascending: true });
  else if (f.sort === "price-desc") q = q.order("price", { ascending: false });
  else q = q.order("created_at", { ascending: false });
  const { data, error } = await q;
  if (error) throw error;
  let rows = data ?? [];

  if (f.category) {
    rows = rows.filter((r) => r.category?.slug === f.category);
  }

  if (f.size) {
    const targetSize = f.size.trim();
    rows = rows.filter((r) =>
      r.variants?.some((v) => v.size === targetSize && (!f.inStock || v.stock > 0)),
    );
  }

  if (f.inStock === true || f.inStock === "true") {
    rows = rows.filter((r) => r.variants?.some((v) => v.stock > 0));
  }

  if (f.minPrice !== undefined && f.minPrice !== "") {
    const min = Number(f.minPrice);
    if (!isNaN(min)) rows = rows.filter((r) => r.price >= min);
  }

  if (f.maxPrice !== undefined && f.maxPrice !== "") {
    const max = Number(f.maxPrice);
    if (!isNaN(max)) rows = rows.filter((r) => r.price <= max);
  }

  if (f.priceRange) {
    if (f.priceRange === "under-1m") {
      rows = rows.filter((r) => r.price < 1_000_000);
    } else if (f.priceRange === "1m-2m") {
      rows = rows.filter((r) => r.price >= 1_000_000 && r.price <= 2_000_000);
    } else if (f.priceRange === "above-2m") {
      rows = rows.filter((r) => r.price > 2_000_000);
    }
  }

  return rows;
}

export async function fetchCatalogWithMetrics(f: CatalogFilters) {
  return fetchCachedCatalog(f, () => fetchCatalogFromDatabase(f));
}

export async function benchmarkCatalogCache(f: CatalogFilters) {
  await clearCatalogCache();
  const miss = await fetchCatalogWithMetrics(f);
  const hit = await fetchCatalogWithMetrics(f);
  return { miss: miss.metrics, hit: hit.metrics, productCount: hit.data.length };
}

export const catalogQuery = (f: CatalogFilters) =>
  queryOptions({
    queryKey: ["catalog", f],
    queryFn: async () => (await fetchCatalogWithMetrics(f)).data,
  });

export type CatalogProduct = Awaited<ReturnType<typeof fetchCatalogFromDatabase>>[number];

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("name");
    if (error) throw error;
    return data;
  },
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(productSelect)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
