import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatIDR } from "@/lib/format";
import { productImageBlendClass, productImageFrameClass } from "@/lib/product-image";
import { sizeLabel } from "@/lib/sizing";
import { ProductImage } from "@/components/store/ProductImage";

export function CartLines({ compact = false }: { compact?: boolean }) {
  const cart = useCart();
  return (
    <ul className="divide-y">
      {cart.items.map((i) => (
        <li key={i.variantId} className="flex min-w-0 gap-3 overflow-hidden py-4">
          {i.image && (
            <div className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl ${productImageFrameClass}`}>
              <ProductImage src={i.image} alt={i.name} className={`h-full w-full rounded-2xl object-contain p-1 ${productImageBlendClass(i.image)}`} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold uppercase">{i.name}</p>
            <p className="text-xs text-muted-foreground">{sizeLabel(i.size)} · {i.storeName}</p>
            <p className="text-sm font-semibold">{formatIDR(i.price)}</p>
            <div className="mt-2 flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-7 w-7" aria-label="Decrease" onClick={() => cart.setQty(i.variantId, i.quantity - 1)} disabled={i.quantity <= 1}><Minus /></Button>
              <span className="w-6 text-center text-sm font-semibold">{i.quantity}</span>
              <Button size="icon" variant="outline" className="h-7 w-7" aria-label="Increase" onClick={() => cart.setQty(i.variantId, i.quantity + 1)} disabled={i.quantity >= i.maxStock}><Plus /></Button>
              <Button size="icon" variant="ghost" className="ml-auto h-7 w-7" aria-label="Remove" onClick={() => cart.remove(i.variantId)}><Trash2 /></Button>
            </div>
          </div>
          {!compact && <p className="text-sm font-semibold">{formatIDR(i.price * i.quantity)}</p>}
        </li>
      ))}
    </ul>
  );
}

export function CartSheet() {
  const cart = useCart();
  return (
    <Sheet open={cart.open} onOpenChange={cart.setOpen}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-3xl uppercase">Cart ({cart.count})</SheetTitle>
        </SheetHeader>
        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <p className="font-semibold">Your cart is empty</p>
            <Button asChild onClick={() => cart.setOpen(false)}><Link to="/shop">Start shopping</Link></Button>
          </div>
        ) : (
          <>
            <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto"><CartLines compact /></div>
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between font-semibold"><span>Subtotal</span><span>{formatIDR(cart.subtotal)}</span></div>
              <Button asChild size="lg" className="w-full" onClick={() => cart.setOpen(false)}><Link to="/checkout">Checkout</Link></Button>
              <Button asChild variant="outline" className="w-full" onClick={() => cart.setOpen(false)}><Link to="/cart">View cart</Link></Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
