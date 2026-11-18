import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, Menu, MoonStar, Search, ShieldCheck, ShoppingBag, Store, SunMedium, User, Globe2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { categoriesQuery } from "@/lib/queries";
import { mergeCategories, getCategoryLabel } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function SiteHeader() {
  const cart = useCart();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);

  const { data: dbCategories } = useQuery(categoriesQuery);
  const categories = mergeCategories(dbCategories);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
    router.invalidate();
  };

  const navItems = [
    { label: t("newestDrop"), search: { sort: "new" } },
    { label: "PG7", search: { collection: "PG7" } },
    { label: "KAI", search: { collection: "KAI" } },
    { label: t("men"), search: { gender: "men" } },
    { label: t("women"), search: { gender: "women" } },
  ];

  const nav = (
    <>
      {navItems.map((n) => (
        <Link key={n.label} to="/shop" search={n.search} onClick={() => setMenu(false)} className="relative py-1 font-semibold opacity-90 transition hover:opacity-100 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform hover:after:scale-x-100">
          {n.label}
        </Link>
      ))}
      <Link to="/account" onClick={() => setMenu(false)} className="py-1 font-semibold opacity-90 hover:opacity-100">{t("member")}</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b glass-light">
      {/* OFFICIAL STORE ANNOUNCEMENT BAR */}
      <div className="bg-hero text-hero-foreground py-1.5 px-4 text-center text-xs font-semibold tracking-wide border-b border-white/10">
        {t("freeShipping")}
      </div>

      <div className="mx-auto flex h-20 max-w-[1600px] items-center gap-3 px-4 md:px-7">
        <button className="lg:hidden" aria-label={t("openMenu")} onClick={() => setMenu(true)}><Menu /></button>
        <Link to="/" className="shrink-0" aria-label="Seaport Home">
          <img src="/Seaport.png" alt="Seaport" className="h-8 w-auto object-contain" />
        </Link>
        <nav className="hidden items-center gap-7 text-[15px] lg:flex">{nav}</nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? t("lightMode") : t("darkMode")}
              className="flex h-9 w-9 items-center justify-center rounded-full border bg-card text-muted-foreground transition hover:text-foreground"
            >
              {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            </button>
            <div className="flex items-center gap-2 rounded-full border bg-card px-2.5 py-1.5">
              <Globe2 className="h-4 w-4 text-muted-foreground" />
              <select
                aria-label={t("language")}
                value={lang}
                onChange={(e) => setLang(e.target.value as "id" | "en")}
                className="bg-transparent text-sm outline-none"
              >
                <option value="id">ID</option>
                <option value="en">EN</option>
              </select>
            </div>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); navigate({ to: "/shop", search: { q: q || undefined } }); }}
            className="hidden h-11 w-56 items-center gap-2 rounded-2xl border bg-card/50 px-4 md:flex"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="w-full bg-transparent text-sm outline-none" aria-label="Search products" />
          </form>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Account"><User /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email ?? user.phone}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/account"><User /> {t("myAccount")}</Link></DropdownMenuItem>
                {hasRole("admin") && (
                  <>
                    <DropdownMenuItem asChild><Link to="/seller"><Store /> {t("storeManagement")}</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/admin"><ShieldCheck /> {t("platformAdmin")}</Link></DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut /> {t("signOut")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm"><Link to="/auth" search={{ redirect: undefined }}>{t("signIn")}</Link></Button>
          )}
          <Button variant="outline" size="icon" className="relative" aria-label={t("openCart")} onClick={() => cart.setOpen(true)}>
            <ShoppingBag />
            {cart.count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">{cart.count}</span>}
          </Button>
        </div>
      </div>
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="flex flex-col gap-5">
          <SheetTitle className="font-display text-2xl uppercase">Menu</SheetTitle>
          <div className="flex items-center justify-between rounded-2xl border bg-card p-2">
            <button type="button" onClick={toggleTheme} className="flex items-center gap-2 text-sm font-medium">
              {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              {theme === "dark" ? t("lightMode") : t("darkMode")}
            </button>
            <select value={lang} onChange={(e) => setLang(e.target.value as "id" | "en")} className="bg-transparent text-sm outline-none">
              <option value="id">ID</option>
              <option value="en">EN</option>
            </select>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setMenu(false); navigate({ to: "/shop", search: { q: q || undefined } }); }} className="flex h-11 items-center gap-2 rounded-2xl border px-4">
            <Search className="h-4 w-4" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="w-full bg-transparent outline-none" />
          </form>
          <nav className="flex flex-col gap-3 text-lg">{nav}</nav>
          <div className="border-t pt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {lang === "id" ? "Kategori Produk" : "Categories"}
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  to="/shop"
                  search={{ category: c.slug }}
                  onClick={() => setMenu(false)}
                  className="py-1 text-muted-foreground hover:text-foreground transition truncate"
                >
                  {getCategoryLabel(c.slug, lang)}
                </Link>
              ))}
            </div>
          </div>
          {user && hasRole("admin") && <Link to="/seller" onClick={() => setMenu(false)} className="flex items-center gap-2 font-semibold"><LayoutDashboard className="h-4 w-4" /> {t("storeManagement")}</Link>}
        </SheetContent>
      </Sheet>
    </header>
  );
}

export { SiteFooter } from "@/components/store/SiteFooter";
