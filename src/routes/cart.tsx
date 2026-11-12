import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { CartLines } from "@/components/store/CartSheet";
import { formatIDR } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart | Seaport" },
      { name: "description", content: "Review the items in your Seaport cart before checkout." },
      { property: "og:title", content: "Your cart | Seaport" },
      { property: "og:description", content: "Review your Seaport cart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-5xl font-extrabold uppercase">Cart</h1>
      {cart.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          <p className="text-xl font-semibold">Your cart is empty</p>
          <Button asChild><Link to="/shop">Start shopping</Link></Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
          <div className="rounded-3xl bg-card px-5"><CartLines /></div>
          <aside className="h-fit space-y-4 rounded-3xl bg-card p-5">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold">{formatIDR(cart.subtotal)}</span></div>
            <p className="text-xs text-muted-foreground">Shipping is calculated at checkout.</p>
            <Button asChild size="lg" className="w-full"><Link to="/checkout">Checkout</Link></Button>
            <Button variant="ghost" className="w-full" onClick={cart.clear}>Clear cart</Button>
          </aside>
        </div>
      )}
    </div>
  );
}
