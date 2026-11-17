import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Truck } from "lucide-react";
import { productQuery, catalogQuery } from "@/lib/queries";
import { formatIDR } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/store/ProductCard";
import { SizeGuideModal } from "@/components/store/SizeGuideModal";
import { cn } from "@/lib/utils";
import { sizesFor, type SizeGroup } from '@/lib/sizing';

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const name = params.slug.split("-").map((w) => w.toUpperCase()).join(" ");
    return {
      meta: [
        { title: `${name} | Seaport` },
        { name: "description", content: `Shop ${name} on Seaport. Sizes, stock and fast shipping across Indonesia.` },
        { property: "og:title", content: `${name} | Seaport` },
        { property: "og:description", content: `Shop ${name} on Seaport.` },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p, isLoading } = useQuery(productQuery(slug));
  const { data: related } = useQuery(catalogQuery({ category: p?.category?.slug }));
  const cart = useCart();
  const navigate = useNavigate();
  const [size, setSize] = useState<string | null>(null);
  const [img, setImg] = useState(0);
  const [group, setGroup] = useState<SizeGroup>('adult');

  if (isLoading) return <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-10 md:grid-cols-2"><Skeleton className="aspect-square rounded-3xl" /><div className="space-y-4"><Skeleton className="h-12 w-3/4" /><Skeleton className="h-6 w-32" /><Skeleton className="h-32" /></div></div>;
  if (!p) return (
    <div className="py-32 text-center">
      <h1 className="text-4xl font-bold uppercase">Product not found</h1>
      <Link to="/shop" className="mt-4 inline-block font-semibold underline">Back to shop</Link>
    </div>
  );

  const isApparel = p.category?.slug === 'apparel';
  const variants = sizesFor(isApparel ? 'apparel' : group).map(value => p.variants.find(v => v.size === value) ?? { id: value, size: value, stock: 0 });
  const selected = variants.find((v) => v.size === size);
  const add = (buy: boolean) => {
    if (!selected || selected.stock < 1) { toast.error("Please choose an available size"); return; }
    cart.add({ variantId: selected.id, productId: p.id, slug: p.slug, name: p.name, size: selected.size, price: p.price, image: p.images[0] ?? null, storeName: p.store?.name ?? "", maxStock: selected.stock });
    if (buy) navigate({ to: "/checkout" });
    else { toast.success("Added to cart"); cart.setOpen(true); }
  };
  const specs = Object.entries((p.specs ?? {}) as Record<string, string>);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-7">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-3xl bg-card shadow-card">
            {p.images[img] ? (
              <img
                src={p.images[img]}
                alt={p.name}
                className="aspect-square w-full object-cover transition-all duration-300"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-muted text-muted-foreground">
                No image available
              </div>
            )}
            {p.images.length > 1 && (
              <Badge
                variant="secondary"
                className="absolute bottom-3 right-3 bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
              >
                POV {img + 1} / {p.images.length}
              </Badge>
            )}
          </div>
          {p.images.length > 1 && (
            <div
              className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none"
              role="tablist"
              aria-label="Sudut Foto Produk (POV Gallery)"
            >
              {p.images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setImg(i)}
                  aria-label={`Lihat POV foto ${i + 1}`}
                  className={cn(
                    "relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all hover:opacity-100",
                    i === img
                      ? "border-primary ring-2 ring-primary/40 shadow-sm"
                      : "border-border opacity-70 hover:border-foreground/50"
                  )}
                >
                  <img
                    src={src}
                    alt={`${p.name} POV ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-primary/90 text-[9px] font-bold text-primary-foreground py-0.5 text-center tracking-wider uppercase">
                      Cover
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-wider text-muted-foreground">{p.store?.name} · {p.category?.name}</p>
            <h1 className="text-5xl font-extrabold uppercase md:text-6xl">{p.name}</h1>
            <p className="mt-2 text-2xl font-semibold">{formatIDR(p.price)}</p>
          </div>
          <p className="text-muted-foreground">{p.description}</p>
          <div>
            {!isApparel && <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Age group"><Button variant={group === 'adult' ? 'default' : 'outline'} onClick={() => { setGroup('adult'); setSize(null); }}>Adult · EU 39–45</Button><Button variant={group === 'kids' ? 'default' : 'outline'} onClick={() => { setGroup('kids'); setSize(null); }}>Kids · EU 29–37</Button></div>}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
              <div className="flex items-center gap-2">
                <span>{isApparel ? 'Select size' : 'Select size (EU)'}</span>
                <SizeGuideModal defaultCategory={isApparel ? 'apparel' : 'footwear'} />
              </div>
              {selected && <span className="text-muted-foreground">{selected.stock} in stock</span>}
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {variants.map((v) => (
                <Button key={v.id} variant="outline" aria-label={`Size ${v.size}${v.stock === 0 ? ', unavailable' : ''}`} disabled={v.stock === 0} onClick={() => setSize(v.size)}
                  className={cn("h-12 rounded-md border font-semibold transition", size === v.size ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-foreground", v.stock === 0 && "cursor-not-allowed line-through opacity-40")}>
                  {v.size}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="flex-1" disabled={!selected || selected.stock === 0} onClick={() => add(false)}>Add to Cart</Button>
            <Button size="lg" variant="brand" className="flex-1" disabled={!selected || selected.stock === 0} onClick={() => add(true)}>Buy Now</Button>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-2xl bg-card p-3"><Truck className="h-4 w-4" /> Ships across Indonesia</div>
            <div className="flex items-center gap-2 rounded-2xl bg-card p-3"><ShieldCheck className="h-4 w-4" /> Verified seller</div>
          </div>
          {specs.length > 0 && (
            <div className="rounded-3xl bg-card p-5">
              <h2 className="mb-3 text-2xl font-bold uppercase">Specifications</h2>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                {specs.map(([k, v]) => (<div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>))}
              </dl>
            </div>
          )}
        </div>
      </div>
      {related && related.filter((r) => r.id !== p.id).length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-4xl font-bold uppercase">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {related.filter((r) => r.id !== p.id).slice(0, 4).map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
