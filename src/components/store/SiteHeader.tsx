import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, Menu, Search, ShieldCheck, ShoppingBag, Store, User } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/Seaport.png.asset.json";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const NAV = [
  { label: "Newest Drop", search: { sort: "new" } },
  { label: "PG7", search: { collection: "PG7" } },
  { label: "KAI", search: { collection: "KAI" } },
  { label: "Men", search: { gender: "men" } },
  { label: "Women", search: { gender: "women" } },
] as const;

export function SiteHeader() {
  const cart = useCart();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
    router.invalidate();
  };

  const nav = (
    <>
      {NAV.map((n) => (
        <Link key={n.label} to="/shop" search={n.search} onClick={() => setMenu(false)} className="relative py-1 font-semibold opacity-90 transition hover:opacity-100 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform hover:after:scale-x-100">
          {n.label}
        </Link>
      ))}
      <Link to="/account" onClick={() => setMenu(false)} className="py-1 font-semibold opacity-90 hover:opacity-100">Member</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b glass-light">
      <div className="mx-auto flex h-20 max-w-[1600px] items-center gap-6 px-4 md:px-7">
        <button className="lg:hidden" aria-label="Open menu" onClick={() => setMenu(true)}><Menu /></button>
        <Link to="/" className="shrink-0"><img src={logo.url} alt="Seaport" className="h-14 w-auto" /></Link>
        <nav className="hidden items-center gap-7 text-[15px] lg:flex">{nav}</nav>
        <div className="ml-auto flex items-center gap-2">
          <form
            onSubmit={(e) => { e.preventDefault(); navigate({ to: "/shop", search: { q: q || undefined } }); }}
            className="hidden h-11 w-56 items-center gap-2 rounded-2xl border bg-card/50 px-4 md:flex"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-full bg-transparent text-sm outline-none" aria-label="Search products" />
          </form>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Account"><User /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email ?? user.phone}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/account"><User /> My account</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/seller"><Store /> {hasRole("seller") ? "Seller dashboard" : "Become a seller"}</Link></DropdownMenuItem>
                {hasRole("admin") && <DropdownMenuItem asChild><Link to="/admin"><ShieldCheck /> Admin</Link></DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm"><Link to="/auth" search={{ redirect: undefined }}>Sign in</Link></Button>
          )}
          <Button variant="outline" size="icon" className="relative" aria-label="Open cart" onClick={() => cart.setOpen(true)}>
            <ShoppingBag />
            {cart.count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">{cart.count}</span>}
          </Button>
        </div>
      </div>
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="flex flex-col gap-5">
          <SheetTitle className="font-display text-2xl uppercase">Menu</SheetTitle>
          <form onSubmit={(e) => { e.preventDefault(); setMenu(false); navigate({ to: "/shop", search: { q: q || undefined } }); }} className="flex h-11 items-center gap-2 rounded-2xl border px-4">
            <Search className="h-4 w-4" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-full bg-transparent outline-none" />
          </form>
          <nav className="flex flex-col gap-3 text-lg">{nav}</nav>
          {user && <Link to="/seller" onClick={() => setMenu(false)} className="flex items-center gap-2 font-semibold"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>}
        </SheetContent>
      </Sheet>
    </header>
  );
}

export { SiteFooter } from "@/components/store/SiteFooter";
