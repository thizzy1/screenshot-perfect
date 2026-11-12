import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  size: string;
  price: number;
  image: string | null;
  storeName: string;
  quantity: number;
  maxStock: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (o: boolean) => void;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "seaport-cart-v1";

export function addToCart(items: CartItem[], item: Omit<CartItem, "quantity">, qty = 1): CartItem[] {
  const existing = items.find((i) => i.variantId === item.variantId);
  if (existing) {
    return items.map((i) =>
      i.variantId === item.variantId ? { ...i, quantity: Math.min(i.quantity + qty, item.maxStock) } : i,
    );
  }
  return [...items, { ...item, quantity: Math.min(qty, item.maxStock) }];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, loaded]);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.quantity * i.price, 0),
      open,
      setOpen,
      add: (item, qty = 1) => setItems((cur) => addToCart(cur, item, qty)),
      setQty: (id, qty) =>
        setItems((cur) =>
          cur.map((i) => (i.variantId === id ? { ...i, quantity: Math.max(1, Math.min(qty, i.maxStock)) } : i)),
        ),
      remove: (id) => setItems((cur) => cur.filter((i) => i.variantId !== id)),
      clear: () => setItems([]),
    }),
    [items, open],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
