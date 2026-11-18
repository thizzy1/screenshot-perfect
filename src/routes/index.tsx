import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard, ProductCardSkeleton } from "@/components/store/ProductCard";
import { CutoutImage } from "@/components/store/CutoutImage";
import { catalogQuery, categoriesQuery, type CatalogProduct } from "@/lib/queries";
import { mergeCategories, getCategoryLabel } from "@/lib/categories";
import { useI18n } from "@/lib/i18n";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Seaport | Official Sportswear & Basketball Store" },
      { name: "description", content: "Official Seaport Store. Shop authentic basketball shoes, running gear and apparel across Indonesia." },
      { property: "og:title", content: "Seaport | Official Sportswear & Basketball Store" },
      { property: "og:description", content: "100% Authentic Sportswear. Curated retail collection from verified Seaport Store." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition shrink-0 inline-flex items-center gap-1.5 cursor-pointer",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "bg-card hover:border-foreground/60 text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function Grid({ filters, limit }: { filters: Parameters<typeof catalogQuery>[0]; limit?: number }) {
  const { data, isLoading } = useQuery(catalogQuery(filters));
  const rows = (data ?? []).slice(0, limit);
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
      {isLoading ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />) : rows.map((p) => <ProductCard key={p.id} p={p} />)}
    </div>
  );
}

function Home() {
  const { lang } = useI18n();
  const { data: products, isLoading } = useQuery(catalogQuery({ sort: "new" }));
  const { data: dbCategories } = useQuery(categoriesQuery);
  const visibleCategories = mergeCategories(dbCategories);

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedGender, setSelectedGender] = useState<string | undefined>();
  const [heroIdx, setHeroIdx] = useState(0);

  const productList = products ?? [];
  const heroList = productList.slice(0, 3);
  const currentHero: CatalogProduct | undefined =
    heroList.length > 0 ? heroList[heroIdx % heroList.length] : undefined;

  // Secondary spotlight product: prefer featured or 2nd active product different from hero
  const spotlightProduct: CatalogProduct | undefined =
    productList.find((p) => p.featured && p.id !== currentHero?.id) ||
    productList.find((p) => p.id !== currentHero?.id);

  const nextHero = () => setHeroIdx((prev) => (prev + 1) % heroList.length);
  const prevHero = () => setHeroIdx((prev) => (prev - 1 + heroList.length) % heroList.length);

  const heroCutoutImage = (currentHero?.specs as Record<string, string> | undefined)?.['banner_image'] || currentHero?.images?.[0];
  const spotlightCutoutImage = (spotlightProduct?.specs as Record<string, string> | undefined)?.['banner_image'] || spotlightProduct?.images?.[0];

  return (
    <div>
      {/* 1. HERO SECTION (ORIGINAL PURPLE GRADIENT & FLOATING CUTOUT STYLE) */}
      <section className="bg-hero-gradient text-hero-foreground">
        {isLoading ? (
          <div className="mx-auto grid max-w-[1600px] items-center gap-8 px-4 py-16 md:grid-cols-2 md:px-7 md:py-24">
            <div className="space-y-6">
              <Skeleton className="h-6 w-32 rounded-full bg-white/20" />
              <Skeleton className="h-20 w-3/4 rounded-2xl bg-white/20" />
              <Skeleton className="h-16 w-full rounded-2xl bg-white/20" />
              <div className="flex gap-3">
                <Skeleton className="h-12 w-36 rounded-full bg-white/20" />
                <Skeleton className="h-12 w-36 rounded-full bg-white/20" />
              </div>
            </div>
            <Skeleton className="aspect-square w-full max-w-lg mx-auto rounded-full bg-white/10" />
          </div>
        ) : currentHero ? (
          <div className="mx-auto grid max-w-[1600px] items-center gap-8 px-4 py-16 md:grid-cols-2 md:px-7 md:py-24">
            {/* TEXT LEFT */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <p className="inline-flex rounded-full glass px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                  {currentHero.collection
                    ? `${currentHero.collection} Collection`
                    : currentHero.category?.name
                    ? currentHero.category.name.toUpperCase()
                    : "New season"}
                </p>
                {heroList.length > 1 && (
                  <span className="text-xs font-semibold opacity-70">
                    {heroIdx % heroList.length + 1} / {heroList.length}
                  </span>
                )}
              </div>

              <h1 className="text-6xl font-extrabold uppercase leading-[0.9] md:text-8xl">
                {currentHero.name}
              </h1>

              <div className="space-y-2">
                <p className="max-w-md text-lg opacity-85 line-clamp-3 leading-relaxed">
                  {currentHero.description || "Performa maksimal dengan kenyamanan luar biasa untuk lapangan dan harian."}
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {formatIDR(currentHero.price)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg" variant="heroSolid">
                  <Link to="/product/$slug" params={{ slug: currentHero.slug }}>
                    Shop Now <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="hero">
                  <Link to="/shop">Explore All</Link>
                </Button>
              </div>

              {/* SLIDE INDICATORS */}
              {heroList.length > 1 && (
                <div className="flex items-center gap-3 pt-3">
                  <div className="flex items-center gap-1.5">
                    {heroList.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setHeroIdx(idx)}
                        aria-label={`Lihat ${item.name}`}
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          idx === heroIdx % heroList.length
                            ? "w-8 bg-hero-foreground"
                            : "w-2.5 bg-hero-foreground/40 hover:bg-hero-foreground/70"
                        )}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      type="button"
                      onClick={prevHero}
                      aria-label="Previous hero product"
                      className="flex h-8 w-8 items-center justify-center rounded-full glass hover:bg-white/20 transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextHero}
                      aria-label="Next hero product"
                      className="flex h-8 w-8 items-center justify-center rounded-full glass hover:bg-white/20 transition"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* FLOATING OBJECT RIGHT (NO BOX, NO CARD CONTAINER) */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-8 rounded-full bg-hero-2 blur-3xl opacity-60 pointer-events-none" />
              {heroCutoutImage ? (
                <CutoutImage
                  src={heroCutoutImage}
                  alt={currentHero.name}
                  className="relative z-10 mx-auto w-full max-w-xl max-h-[520px] object-contain drop-shadow-[0_25px_25px_rgba(0,0,0,0.45)] transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="relative z-10 text-center opacity-70 py-16">
                  Produk segera hadir
                </div>
              )}
            </div>
          </div>
        ) : (
          /* FALLBACK BANNER JIKA DATABASE KOSONG */
          <div className="mx-auto max-w-[1600px] px-4 py-20 text-center md:px-7 md:py-28">
            <p className="inline-flex rounded-full glass px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              Official Store
            </p>
            <h1 className="mt-4 text-6xl font-extrabold uppercase leading-[0.9] md:text-8xl">
              SEAPORT
            </h1>
            <p className="mx-auto mt-4 max-w-md text-lg opacity-85">
              100% Authentic Sportswear. Rilisan resmi sepatu basket, running gear, dan apparel original.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="heroSolid">
                <Link to="/shop">Explore Collection</Link>
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* 2. COLLECTION GRID */}
      <section className="mx-auto max-w-[1600px] px-4 py-16 md:px-7">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-4xl font-bold uppercase md:text-5xl">ANTA KAI Collection</h2>
          <Link to="/shop" search={{ collection: "KAI" }} className="text-sm font-semibold hover:underline">
            View all
          </Link>
        </div>
        <Grid filters={{ collection: "KAI" }} limit={4} />
      </section>

      {/* 3. SPOTLIGHT PROMO BANNER (FLOATING CUTOUT STYLE DI SISI KIRI) */}
      {spotlightProduct && (
        <section className="mx-auto max-w-[1600px] px-4 md:px-7">
          <div className="grid overflow-hidden rounded-[2rem] bg-hero-gradient text-hero-foreground md:grid-cols-2">
            {/* FLOATING OBJECT LEFT (NO BOX, NO CARD CONTAINER) */}
            <div className="relative flex items-center justify-center p-8 md:p-12">
              <div className="absolute inset-8 rounded-full bg-hero-2 blur-3xl opacity-60 pointer-events-none" />
              {spotlightCutoutImage ? (
                <CutoutImage
                  src={spotlightCutoutImage}
                  alt={spotlightProduct.name}
                  className="relative z-10 mx-auto w-full max-w-lg max-h-[460px] object-contain drop-shadow-[0_25px_25px_rgba(0,0,0,0.45)] transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="relative z-10 text-center opacity-70">Foto produk</div>
              )}
            </div>

            {/* TEXT RIGHT */}
            <div className="flex flex-col justify-center gap-5 p-8 md:p-14">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
                {spotlightProduct.featured ? "Featured Edition" : "Special Spotlight"}
              </p>
              <h2 className="text-5xl font-extrabold uppercase md:text-6xl">
                {spotlightProduct.name}
              </h2>
              <p className="opacity-85 line-clamp-3 leading-relaxed">
                {spotlightProduct.description || "Desain atletik inovatif dengan material premium berdaya tahan tinggi."}
              </p>
              <p className="text-2xl font-bold">
                {formatIDR(spotlightProduct.price)}
              </p>
              <div>
                <Button asChild size="lg" variant="brand">
                  <Link to="/product/$slug" params={{ slug: spotlightProduct.slug }}>
                    Order Now <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. NEWEST DROPS & CATEGORY CATALOG SECTION */}
      <section className="mx-auto max-w-[1600px] px-4 py-16 md:px-7">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-4xl font-bold uppercase md:text-5xl">
              {lang === "id" ? "Koleksi Terbaru" : "Newest Drops"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {lang === "id"
                ? "Jelajahi koleksi sepatu, apparel, dan peralatan olahraga resmi Seaport."
                : "Explore official Seaport footwear, apparel, and performance gear."}
            </p>
          </div>
          <Link
            to="/shop"
            search={{
              sort: "new",
              category: selectedCategory,
              gender: selectedGender,
            }}
            className="text-sm font-semibold hover:underline"
          >
            {lang === "id" ? "Lihat Semua di Shop" : "Shop all"} &rarr;
          </Link>
        </div>

        {/* DYNAMIC CATEGORY & GENDER FILTER PILLS BAR */}
        <div className="mb-8 overflow-x-auto scrollbar-none pb-2 pt-1 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex items-center gap-2 flex-nowrap w-max">
            <Chip
              active={!selectedCategory}
              onClick={() => setSelectedCategory(undefined)}
            >
              {getCategoryLabel("all", lang)}
            </Chip>
            {visibleCategories.map((c) => (
              <Chip
                key={c.slug}
                active={selectedCategory === c.slug}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === c.slug ? undefined : c.slug
                  )
                }
              >
                {getCategoryLabel(c.slug, lang)}
              </Chip>
            ))}

            <span className="mx-1.5 h-6 w-px bg-border shrink-0" />

            {(["men", "women"] as const).map((g) => (
              <Chip
                key={g}
                active={selectedGender === g}
                onClick={() =>
                  setSelectedGender(selectedGender === g ? undefined : g)
                }
              >
                {getCategoryLabel(g, lang)}
              </Chip>
            ))}
          </div>
        </div>

        <Grid
          filters={{
            sort: "new",
            category: selectedCategory,
            gender: selectedGender,
          }}
          limit={8}
        />
      </section>
    </div>
  );
}
