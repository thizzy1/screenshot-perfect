import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/account")({
  
  head: () => ({
    meta: [
      { title: "My account | Seaport" },
      { name: "description", content: "My account on the Seaport sportswear marketplace." },
      { property: "og:title", content: "My account | Seaport" },
      { property: "og:description", content: "My account on Seaport." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-5xl font-extrabold uppercase">My account</h1>
      <p className="mt-3 text-muted-foreground">This page is not finished yet.</p>
      <Link to="/shop" className="mt-6 inline-block font-semibold underline">Continue shopping</Link>
    </div>
  ),
});
