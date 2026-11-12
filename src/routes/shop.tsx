import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/store/ProductCard";
import { catalogQuery, categoriesQuery, type CatalogFilters } from "@/lib/queries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const str = (v: unknown) => (typeof v === "string" && v.length ? v : undefined);

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): CatalogFilters => ({
    q: str(s["q"]), category: str(s["category"]), gender: str(s["gender"]), collection: str(s["collection"]), sort: str(s["sort"]),
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

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("rounded-full border px-4 py-1.5 text-sm font-semibold transition", active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-foreground")}>
      {children}
    </button>
  );
}

function Shop() {
  const f = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const set = (patch: Partial<CatalogFilters>) => navigate({ search: (prev) => ({ ...prev, ...patch }) });
  const { data, isLoading } = useQuery(catalogQuery(f));
  const { data: cats } = useQuery(categoriesQuery);
  const title = f.q ? `Results for “${f.q}”` : f.collection ? `${f.collection} Collection` : f.gender ? `${f.gender === "men" ? "Men" : "Women"}` : "Shop all";

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-7">
      <h1 className="text-5xl font-extrabold uppercase md:text-6xl">{title}</h1>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Chip active={!f.category} onClick={() => set({ category: undefined })}>All</Chip>
        {cats?.map((c) => <Chip key={c.id} active={f.category === c.slug} onClick={() => set({ category: c.slug })}>{c.name}</Chip>)}
        <span className="mx-2 hidden h-6 w-px bg-border md:block" />
        {(["men", "women"] as const).map((g) => <Chip key={g} active={f.gender === g} onClick={() => set({ gender: f.gender === g ? undefined : g })}>{g === "men" ? "Men" : "Women"}</Chip>)}
        <div className="ml-auto w-48">
          <Select value={f.sort ?? "new"} onValueChange={(v) => set({ sort: v })}>
            <SelectTrigger className="rounded-full bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Newest</SelectItem>
              <SelectItem value="price-asc">Price: low to high</SelectItem>
              <SelectItem value="price-desc">Price: high to low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {(f.q || f.collection) && (
        <p className="mt-3 text-sm text-muted-foreground">
          Filtered{f.q && <> by “{f.q}”</>}{f.collection && <> in {f.collection}</>}. <Link to="/shop" className="font-semibold underline">Clear filters</Link>
        </p>
      )}
      <div className="mt-8 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {isLoading && Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        {data?.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
      {!isLoading && data?.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <SearchX className="h-12 w-12 text-muted-foreground" />
          <p className="text-xl font-semibold">No products match these filters</p>
          <Link to="/shop" className="font-semibold underline">Clear filters</Link>
        </div>
      )}
    </div>
  );
}
