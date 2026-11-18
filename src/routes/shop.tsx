import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SearchX, Check, X, SlidersHorizontal } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/store/ProductCard";
import { catalogQuery, categoriesQuery, type CatalogFilters } from "@/lib/queries";
import { mergeCategories, getCategoryLabel } from "@/lib/categories";
import { useI18n } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isAccessoriesCategory, oneSizeValue } from "@/lib/sizing";

const str = (v: unknown) => (typeof v === "string" && v.length ? v : undefined);
const boolStr = (v: unknown) => (v === true || v === "true" ? "true" : undefined);

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): CatalogFilters => ({
    q: str(s["q"]),
    category: str(s["category"]),
    gender: str(s["gender"]),
    collection: str(s["collection"]),
    sort: str(s["sort"]),
    size: str(s["size"]),
    inStock: boolStr(s["inStock"]),
    priceRange: str(s["priceRange"]),
  }),
  head: () => ({
    meta: [
      { title: "Shop all | Seaport" },
      { name: "description", content: "Browse basketball shoes, running shoes, apparel and accessories from verified Seaport sellers." },
      { property: "og:title", content: "Shop all | Seaport" },
      { property: "og:description", content: "Browse sportswear from verified Seaport sellers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Shop,
});

function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition inline-flex items-center gap-1.5",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "bg-card hover:border-foreground/60 text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

const QUICK_SHOE_SIZES = ["39", "40", "41", "42", "43", "44", "45"] as const;
const QUICK_APPAREL_SIZES = ["S", "M", "L", "XL"] as const;

function Shop() {
  const { lang, t } = useI18n();
  const f = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const set = (patch: Partial<CatalogFilters>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const { data, isLoading } = useQuery(catalogQuery(f));
  const { data: cats } = useQuery(categoriesQuery);
  const visibleCategories = mergeCategories(cats);

  const title = f.q
    ? `Results for “${f.q}”`
    : f.collection
    ? `${f.collection} Collection`
    : f.gender
    ? getCategoryLabel(f.gender, lang)
    : f.category
    ? getCategoryLabel(f.category, lang)
    : lang === "id" ? "Semua Produk" : "Shop all";

  const isApparelCategory = f.category === "apparel";
  const isAccessories = isAccessoriesCategory(f.category);
  const supportsOneSize = f.category === "badminton" || f.category === "cycling" || f.category === "others";
  const hasActiveFilters = Boolean(
    f.q ||
    f.category ||
    f.gender ||
    f.collection ||
    f.size ||
    f.inStock ||
    f.priceRange
  );

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-7">
      <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
        <h1 className="text-5xl font-extrabold uppercase md:text-6xl">{title}</h1>
        {data && (
          <p className="text-sm text-muted-foreground font-medium">
            {lang === "id" ? "Menampilkan" : "Showing"}{" "}
            <span className="text-foreground font-bold">{data.length}</span>{" "}
            {lang === "id" ? "produk" : "products"}
          </p>
        )}
      </div>

      {/* FILTER ROW 1: Kategori, Gender & Sort (Horizontal scrollable with overflow-x-auto flex-nowrap) */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="overflow-x-auto scrollbar-none pb-2 pt-1 -mx-4 px-4 md:mx-0 md:px-0 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-nowrap w-max">
            <Chip active={!f.category} onClick={() => set({ category: undefined })}>
              {getCategoryLabel("all", lang)}
            </Chip>
            {visibleCategories.map((c) => (
              <Chip
                key={c.id}
                active={f.category === c.slug}
                onClick={() => {
                  const nextCategory = f.category === c.slug ? undefined : c.slug;
                  set({ category: nextCategory, size: isAccessoriesCategory(nextCategory) ? undefined : f.size });
                }}
              >
                {getCategoryLabel(c.slug, lang)}
              </Chip>
            ))}

            <span className="mx-1 h-5 w-px bg-border shrink-0" />

            {(["men", "women"] as const).map((g) => (
              <Chip
                key={g}
                active={f.gender === g}
                onClick={() => set({ gender: f.gender === g ? undefined : g })}
              >
                {getCategoryLabel(g, lang)}
              </Chip>
            ))}
          </div>
        </div>

        <div className="w-44 shrink-0">
          <Select value={f.sort ?? "new"} onValueChange={(v) => set({ sort: v })}>
            <SelectTrigger className="rounded-full bg-card h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">{lang === "id" ? "Terbaru" : "Newest"}</SelectItem>
              <SelectItem value="price-asc">{lang === "id" ? "Harga: Termurah" : "Price: low to high"}</SelectItem>
              <SelectItem value="price-desc">{lang === "id" ? "Harga: Tertinggi" : "Price: high to low"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* FILTER ROW 2: Ukuran (Size), In Stock & Rentang Harga */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border bg-card/50 p-3 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filter:</span>
        </div>

        {/* Toggle Stok Tersedia */}
        <button
          type="button"
          onClick={() => set({ inStock: f.inStock ? undefined : "true" })}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold transition inline-flex items-center gap-1.5",
            f.inStock === "true"
              ? "border-emerald-500 bg-emerald-600 text-white shadow-xs"
              : "border-border bg-card hover:border-foreground/50 text-foreground"
          )}
        >
          {f.inStock === "true" && <Check className="h-3 w-3 stroke-[3]" />}
          <span>Hanya Stok Tersedia</span>
        </button>

        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />

        {/* Filter Rentang Harga */}
        <div className="w-40 sm:w-44">
          <Select
            value={f.priceRange ?? "all"}
            onValueChange={(v) => set({ priceRange: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="h-7 text-xs rounded-full bg-card">
              <SelectValue placeholder="Rentang Harga" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Harga</SelectItem>
              <SelectItem value="under-1m">&lt; Rp 1.000.000</SelectItem>
              <SelectItem value="1m-2m">Rp 1 jt – Rp 2 jt</SelectItem>
              <SelectItem value="above-2m">&gt; Rp 2.000.000</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />

        {/* Chips Ukuran Cepat */}
        <div className="flex flex-wrap items-center gap-1.5">
          {isAccessories ? (
            <span className="text-xs text-muted-foreground">Ukuran mengikuti deskripsi / spesifikasi produk.</span>
          ) : <>
          <span className="text-xs font-medium text-muted-foreground mr-0.5">
            {isApparelCategory ? "Size:" : "Size (EU):"}
          </span>

          {!isApparelCategory &&
            QUICK_SHOE_SIZES.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => set({ size: f.size === sz ? undefined : sz })}
                className={cn(
                  "h-7 min-w-7 px-2 rounded-md border text-xs font-bold transition",
                  f.size === sz
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-card hover:border-foreground/60 text-foreground"
                )}
              >
                {sz}
              </button>
            ))}

          {QUICK_APPAREL_SIZES.map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => set({ size: f.size === sz ? undefined : sz })}
              className={cn(
                "h-7 min-w-7 px-2 rounded-md border text-xs font-bold transition",
                f.size === sz
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border bg-card hover:border-foreground/60 text-foreground"
              )}
            >
              {sz}
            </button>
          ))}
          {supportsOneSize && (
            <button
              type="button"
              onClick={() => set({ size: f.size === oneSizeValue ? undefined : oneSizeValue })}
              className={cn(
                "h-7 px-2 rounded-md border text-xs font-bold transition",
                f.size === oneSizeValue
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border bg-card hover:border-foreground/60 text-foreground"
              )}
            >
              One Size
            </button>
          )}
          </>}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() =>
              navigate({
                search: () => ({ sort: f.sort }),
              })
            }
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition underline underline-offset-4"
          >
            <X className="h-3 w-3" />
            <span>Reset filter</span>
          </button>
        )}
      </div>

      {/* ACTIVE FILTER PILLS */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Filter aktif:</span>
          {f.q && <Badge variant="secondary">“{f.q}”</Badge>}
          {f.category && <Badge variant="secondary">Kategori: {f.category}</Badge>}
          {f.gender && <Badge variant="secondary">Gender: {f.gender}</Badge>}
          {f.collection && <Badge variant="secondary">Koleksi: {f.collection}</Badge>}
          {f.size && <Badge variant="secondary">Ukuran: {f.size}</Badge>}
          {f.inStock === "true" && <Badge variant="secondary">Stok Tersedia</Badge>}
          {f.priceRange && (
            <Badge variant="secondary">
              Harga:{" "}
              {f.priceRange === "under-1m"
                ? "< Rp 1 jt"
                : f.priceRange === "1m-2m"
                ? "Rp 1 - 2 jt"
                : "> Rp 2 jt"}
            </Badge>
          )}
          <Link to="/shop" className="font-semibold text-primary underline ml-1">
            Hapus semua
          </Link>
        </div>
      )}

      {/* PRODUCT GRID */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {isLoading && Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        {data?.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>

      {!isLoading && data?.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <SearchX className="h-12 w-12 text-muted-foreground" />
          <p className="text-xl font-semibold">Tidak ada produk yang sesuai dengan filter ini</p>
          <p className="text-sm text-muted-foreground">
            Coba pilih ukuran lain, ubah rentang harga, atau reset filter Anda.
          </p>
          <Link to="/shop" className="mt-2 font-semibold underline text-primary">
            Reset semua filter
          </Link>
        </div>
      )}
    </div>
  );
}
