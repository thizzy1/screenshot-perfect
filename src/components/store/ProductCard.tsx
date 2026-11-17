import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { formatIDR } from "@/lib/format";
import { useCart } from "@/lib/cart";
import type { CatalogProduct } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button';
import { sizeLabel } from '@/lib/sizing';

export function ProductCard({ p }: { p: CatalogProduct }) {
  const cart = useCart();
  const stock = p.variants.reduce((s, v) => s + v.stock, 0);
  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    const v = [...p.variants].sort((a, b) => Number(a.size) - Number(b.size)).find((x) => x.stock > 0);
    if (!v) { toast.error("Sold out"); return; }
    cart.add({ variantId: v.id, productId: p.id, slug: p.slug, name: p.name, size: v.size, price: p.price, image: p.images[0] ?? null, storeName: "SEAPORT OFFICIAL", maxStock: v.stock });
    toast.success(`${p.name} (${sizeLabel(v.size)}) added to cart`);
    cart.setOpen(true);
  };
  return (
    <Link to="/product/$slug" params={{ slug: p.slug }} className="group flex flex-col overflow-hidden rounded-3xl bg-card shadow-card transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {p.images[0] && (
          <img src={p.images[0]} alt={p.name} loading="lazy" width={600} height={600} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
        <span className={stock === 0 ? "absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-brand-foreground" : stock < 20 ? "absolute left-3 top-3 rounded-full bg-warning px-2.5 py-1 text-xs font-semibold text-foreground" : "absolute left-3 top-3 rounded-full glass-light px-2.5 py-1 text-xs font-semibold"}>
          {stock === 0 ? "Sold out" : stock < 20 ? `Only ${stock} left` : "In stock"}
        </span>
      </div>
      <div className="flex flex-1 items-end justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">SEAPORT OFFICIAL · {p.category?.name}</p>
          <h3 className="truncate text-xl font-bold uppercase">{p.name}</h3>
          <p className="font-semibold">{formatIDR(p.price)}</p>
        </div>
        <Button size="icon" disabled={stock === 0} onClick={quickAdd} aria-label={`Add ${p.name} to cart`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110">
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-card">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}
