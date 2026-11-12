import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardSkeleton } from "@/components/store/ProductCard";
import { catalogQuery } from "@/lib/queries";
import hero from "@/assets/kai3-magnetic-energy.png.asset.json";
import anta from "@/assets/Anta1.webp.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Seaport | ANTA KAI & Premium Sportswear" },
      { name: "description", content: "Kyrie: The Return. Shop the latest ANTA KAI gear, running shoes and apparel on Seaport." },
      { property: "og:title", content: "Seaport | ANTA KAI & Premium Sportswear" },
      { property: "og:description", content: "Shop the latest ANTA KAI gear and unlock exclusive member benefits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

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
  return (
    <div>
      <section className="bg-hero-gradient text-hero-foreground">
        <div className="mx-auto grid max-w-[1600px] items-center gap-8 px-4 py-16 md:grid-cols-2 md:px-7 md:py-24">
          <div className="space-y-6">
            <p className="inline-flex rounded-full glass px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]">New season</p>
            <h1 className="text-6xl font-extrabold uppercase leading-[0.9] md:text-8xl">Kyrie:<br />The Return</h1>
            <p className="max-w-md text-lg opacity-85">Join us on Kyrie’s journey and witness his return. Shop the latest KAI gear, unlock your exclusive benefits.</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="heroSolid"><Link to="/shop" search={{ collection: "KAI" }}>Shop KAI <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="hero"><Link to="/auth" search={{ redirect: undefined }}>Join Now</Link></Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-8 rounded-full bg-hero-2 blur-3xl opacity-60" />
            <img src={hero.url} alt="ANTA KAI 3 Magnetic Energy" width={900} height={900} className="relative mx-auto w-full max-w-xl drop-shadow-2xl" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 py-16 md:px-7">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-4xl font-bold uppercase md:text-5xl">ANTA KAI Collection</h2>
          <Link to="/shop" search={{ collection: "KAI" }} className="text-sm font-semibold hover:underline">View all</Link>
        </div>
        <Grid filters={{ collection: "KAI" }} limit={4} />
      </section>

      <section className="mx-auto max-w-[1600px] px-4 md:px-7">
        <div className="grid overflow-hidden rounded-[2rem] bg-hero-gradient text-hero-foreground md:grid-cols-2">
          <img src={anta.url} alt="ANTA KAI Feng" loading="lazy" className="h-full max-h-[520px] w-full object-cover" />
          <div className="flex flex-col justify-center gap-5 p-8 md:p-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">Limited edition</p>
            <h2 className="text-5xl font-extrabold uppercase md:text-6xl">ANTA KAI “Feng”</h2>
            <p className="opacity-85">Inspired by traditional Chinese kites, incorporating the path of wind and classical structural aesthetics. The Chinese characters “Kyrie Irving” on the tongue add an Eastern touch.</p>
            <div><Button asChild size="lg" variant="brand"><Link to="/shop" search={{ collection: "KAI" }}>Order Now</Link></Button></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 py-16 md:px-7">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-4xl font-bold uppercase md:text-5xl">Newest Drops</h2>
          <Link to="/shop" search={{ sort: "new" }} className="text-sm font-semibold hover:underline">Shop all</Link>
        </div>
        <Grid filters={{ sort: "new" }} limit={8} />
      </section>
    </div>
  );
}
