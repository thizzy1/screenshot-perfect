import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/seller")({
  
  head: () => ({
    meta: [
      { title: "Seller dashboard | Seaport" },
      { name: "description", content: "Seller dashboard on the Seaport sportswear marketplace." },
      { property: "og:title", content: "Seller dashboard | Seaport" },
      { property: "og:description", content: "Seller dashboard on Seaport." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-5xl font-extrabold uppercase">Seller dashboard</h1>
      <p className="mt-3 text-muted-foreground">This page is not finished yet.</p>
      <Link to="/shop" className="mt-6 inline-block font-semibold underline">Continue shopping</Link>
    </div>
  ),
});
