import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ShieldCheck, Truck, X } from "lucide-react";
import { productQuery, catalogQuery } from "@/lib/queries";
import { formatIDR } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { isUserBanned, bannedReason } from "@/lib/user-access";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProductCard } from "@/components/store/ProductCard";
import { SizeGuideModal } from "@/components/store/SizeGuideModal";
import { cn } from "@/lib/utils";
import { productImageBlendClass, productImageFrameClass } from '@/lib/product-image';
import { isAccessoriesCategory, isOthersCategory, type SizeGroup, sizeModeForCategory, sizeOptionsForMode, oneSizeValue, kidsShoeSizes } from '@/lib/sizing';
import { useI18n } from '@/lib/i18n';
import { getCategoryLabel } from '@/lib/categories';

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
  const { lang, t } = useI18n();
  const { slug } = Route.useParams();
  const { user, hasRole } = useAuth();
  const { data: p, isLoading } = useQuery(productQuery(slug));
  const { data: related } = useQuery(catalogQuery({ category: p?.category?.slug }));
  const { data: profile } = useQuery({
    queryKey: ['profile-ban', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('profiles').select('status, is_banned, ban_reason').eq('id', user.id).maybeSingle() as { data: any; error: any };
      if (error) throw error;
      return data as any;
    },
  });
  const cart = useCart();
  const navigate = useNavigate();
  const [size, setSize] = useState<string | null>(null);
  const [img, setImg] = useState(0);
  const [group, setGroup] = useState<SizeGroup>('adult');
  const [mode, setMode] = useState<'footwear' | 'apparel' | 'one-size'>('footwear');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isAdmin = hasRole('admin');
  const isBanned = isUserBanned(profile);

  useEffect(() => {
    if (!p) return;
    const categorySlug = p.category?.slug ?? '';
    const explicitMode = (p.specs as Record<string, any> | null)?.['size_mode'] ?? null;
    setMode(sizeModeForCategory(categorySlug, explicitMode));
    if (categorySlug === 'apparel') setGroup('apparel');
    else if (['badminton', 'cycling'].includes(categorySlug)) setGroup('adult');
  }, [p?.category?.slug, p?.specs]);

  if (isLoading) return <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-10 md:grid-cols-2"><Skeleton className="aspect-square rounded-3xl" /><div className="space-y-4"><Skeleton className="h-12 w-3/4" /><Skeleton className="h-6 w-32" /><Skeleton className="h-32" /></div></div>;
  if (!p) return (
    <div className="py-32 text-center">
      <h1 className="text-4xl font-bold uppercase">Product not found</h1>
      <Link to="/shop" className="mt-4 inline-block font-semibold underline">Back to shop</Link>
    </div>
  );

  const categorySlug = p.category?.slug ?? '';
  const isAccessories = isAccessoriesCategory(categorySlug) || isAccessoriesCategory(p.category?.name);
  const isOthers = isOthersCategory(categorySlug) || isOthersCategory(p.category?.name);
  const isApparel = categorySlug === 'apparel';
  const isSpecialCategory = ['badminton', 'cycling'].includes(categorySlug);
  const explicitMode = (p.specs as Record<string, any> | null)?.['size_mode'] ?? null;
  const finalMode = isAccessories
    ? 'one-size'
    : isOthers
    ? (explicitMode === 'footwear' || explicitMode === 'apparel' ? explicitMode : 'one-size')
    : isSpecialCategory
    ? mode
    : sizeModeForCategory(categorySlug, explicitMode);

  const hasOnlyOneSize = isAccessories || (isOthers && (p.variants.length === 0 || p.variants.every((v) => v.size === oneSizeValue) || finalMode === 'one-size'));
  const hasKidsVariants = p.variants.some((v) => kidsShoeSizes.includes(v.size as any));
  const categoryLabel = getCategoryLabel(categorySlug || p.category?.name, lang);

  const variantValues = hasOnlyOneSize ? [oneSizeValue] : sizeOptionsForMode(finalMode, isApparel ? 'apparel' : group);
  const prevImage = () => setImg((prev) => (p.images.length ? (prev - 1 + p.images.length) % p.images.length : 0));
  const nextImage = () => setImg((prev) => (p.images.length ? (prev + 1) % p.images.length : 0));
  const variants = variantValues.map((value) => {
    if (value === oneSizeValue) {
      const oneSizeVariant = p.variants.find((variant) => variant.size === oneSizeValue);
      return { id: oneSizeVariant?.id ?? 'one-size', size: oneSizeValue, stock: oneSizeVariant?.stock ?? 0 };
    }
    return p.variants.find((v) => v.size === value) ?? { id: value, size: value, stock: 0 };
  });
  const selected = variants.find((v) => v.size === (hasOnlyOneSize ? oneSizeValue : size));
  const add = (buy: boolean) => {
    if (isAdmin) {
      toast.error('Admin toko tidak dapat membeli produk sendiri.');
      navigate({ to: '/seller' });
      return;
    }
    if (isBanned) {
      toast.error(bannedReason(profile));
      return;
    }
    if (!selected || selected.stock < 1) { toast.error(finalMode === 'one-size' ? 'Produk ini sedang habis stok.' : 'Please choose an available size'); return; }
    cart.add({ variantId: selected.id, productId: p.id, slug: p.slug, name: p.name, size: selected.size, price: p.price, image: p.images[0] ?? null, storeName: "SEAPORT OFFICIAL", maxStock: selected.stock });
    if (buy) navigate({ to: "/checkout" });
    else { toast.success("Added to cart"); cart.setOpen(true); }
  };
  const specs = Object.entries((p.specs ?? {}) as Record<string, string>).filter(([key]) => !['banner_image', 'size_mode'].includes(key));
  const mainImage = p.images[img];
  const mainImageBlendClass = productImageBlendClass(mainImage);

  return (
    <div className="mx-auto max-w-[1400px] overflow-x-hidden px-4 py-10 md:px-7">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-3xl bg-card shadow-card">
            {p.images[img] ? (
              <img
                src={p.images[img]}
                alt={p.name}
                onClick={() => setLightboxOpen(true)}
                className="aspect-square w-full object-contain"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-muted text-muted-foreground">
                No image available
              </div>
            )}
            {p.images.length > 1 && (
              <>
                <button type="button" aria-label="Previous image" onClick={prevImage} className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border bg-background/80 text-foreground shadow-sm backdrop-blur">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Next image" onClick={nextImage} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border bg-background/80 text-foreground shadow-sm backdrop-blur">
                  <ChevronRight className="h-4 w-4" />
                </button>
                <Badge
                  variant="secondary"
                  className="absolute bottom-3 right-3 bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
                >
                  POV {img + 1} / {p.images.length}
                </Badge>
              </>
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
            <p className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">
              SEAPORT OFFICIAL{categoryLabel ? ` · ${categoryLabel}` : ''}
            </p>
            <h1 className="text-5xl font-extrabold uppercase md:text-6xl">{p.name}</h1>
            <p className="mt-2 text-2xl font-semibold">{formatIDR(p.price)}</p>
          </div>
          <p className="text-muted-foreground">{p.description}</p>
          <div>
            {isSpecialCategory && (
              <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Product size category">
                <Button variant={finalMode === 'footwear' ? 'default' : 'outline'} onClick={() => { setMode('footwear'); setSize(null); }}>Shoes · EU</Button>
                <Button variant={finalMode === 'apparel' ? 'default' : 'outline'} onClick={() => { setMode('apparel'); setSize(null); }}>Apparel · XS–XXL</Button>
                <Button variant={finalMode === 'one-size' ? 'default' : 'outline'} onClick={() => { setMode('one-size'); setSize(oneSizeValue); }}>Equipment · One Size</Button>
              </div>
            )}
            {!isApparel && !isSpecialCategory && !hasOnlyOneSize && hasKidsVariants && (
              <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Age group">
                <Button variant={group === 'adult' ? 'default' : 'outline'} onClick={() => { setGroup('adult'); setSize(null); }}>
                  {t('adultSize')}
                </Button>
                <Button variant={group === 'kids' ? 'default' : 'outline'} onClick={() => { setGroup('kids'); setSize(null); }}>
                  {t('kidsSize')}
                </Button>
              </div>
            )}
            {hasOnlyOneSize ? (
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
                <span>{t('seeDescForSize')}</span>
                {selected && <span className="text-muted-foreground">{selected.stock} {t('inStock')}</span>}
              </div>
            ) : (
              <>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <span>{finalMode === 'one-size' ? t('selectSize') : isApparel ? t('selectSize') : t('selectSizeEU')}</span>
                    {!finalMode || finalMode === 'one-size' ? null : <SizeGuideModal defaultCategory={isApparel ? 'apparel' : 'footwear'} />}
                  </div>
                  {selected && <span className="text-muted-foreground">{selected.stock} {t('inStock')}</span>}
                </div>
                {finalMode === 'one-size' ? (
                  <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                    {t('seeDescForSize')}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {variants.map((v) => (
                      <Button key={v.id} variant="outline" aria-label={`Size ${v.size}${v.stock === 0 ? ', unavailable' : ''}`} disabled={v.stock === 0} onClick={() => setSize(v.size)}
                        className={cn("h-12 rounded-md border font-semibold transition", size === v.size ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-foreground", v.stock === 0 && "cursor-not-allowed line-through opacity-40")}>
                        {v.size}
                      </Button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          {isAdmin || isBanned ? (
            <div className="space-y-3">
              {(isAdmin || isBanned) && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                  {isAdmin
                    ? 'Admin mode sedang aktif — gunakan panel manajemen toko untuk mengelola katalog dan stok.'
                    : bannedReason(profile)}
                </div>
              )}
              {isAdmin && (
                <Button asChild size="lg" className="w-full">
                  <Link to="/seller">Admin Mode — Manage Product</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="flex-1" disabled={!selected || selected.stock === 0} onClick={() => add(false)}>Add to Cart</Button>
              <Button size="lg" variant="brand" className="flex-1" disabled={!selected || selected.stock === 0} onClick={() => add(true)}>Buy Now</Button>
            </div>
          )}
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-2xl bg-card p-3"><Truck className="h-4 w-4" /> Ships across Indonesia</div>
            <div className="flex items-center gap-2 rounded-2xl bg-card p-3"><ShieldCheck className="h-4 w-4" /> 100% Official & Authentic</div>
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

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          showCloseButton={false}
          className={`max-w-5xl overflow-hidden border-0 p-0 shadow-none [&>button.absolute]:hidden ${productImageFrameClass}`}
        >
          <div className={`relative flex min-w-0 items-center justify-center overflow-hidden ${productImageFrameClass}`}>
            <button
              type="button"
              aria-label="Close fullscreen preview"
              onClick={() => setLightboxOpen(false)}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition-transform hover:scale-105 hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/80 cursor-pointer shadow-md"
            >
              <X className="h-5 w-5" />
            </button>
            {p.images.length > 1 && (
              <button type="button" aria-label="Previous image" onClick={prevImage} className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {p.images.length > 1 && (
              <button type="button" aria-label="Next image" onClick={nextImage} className="absolute right-12 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white">
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
            {p.images[img] ? (
              <img src={p.images[img]} alt={p.name} className={`max-h-[85vh] w-full rounded-lg object-contain p-4 md:p-8 ${mainImageBlendClass}`} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
