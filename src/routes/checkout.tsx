import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout")({
  
  head: () => ({
    meta: [
      { title: "Checkout | Seaport" },
      { name: "description", content: "Checkout on the Seaport sportswear marketplace." },
      { property: "og:title", content: "Checkout | Seaport" },
      { property: "og:description", content: "Checkout on Seaport." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-5xl font-extrabold uppercase">Checkout</h1>
      <p className="mt-3 text-muted-foreground">This page is not finished yet.</p>
      <Link to="/shop" className="mt-6 inline-block font-semibold underline">Continue shopping</Link>
    </div>
  ),
});
