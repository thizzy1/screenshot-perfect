import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const PATH_RE = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.[a-z0-9]{1,5}$/i;

// Serves product images via short-lived signed links. The storage policy only allows
// images uploaded by an admin or a verified store owner, so no service key is needed
// (this also works in local `npm run dev` where only the public key is available).
export const Route = createFileRoute("/api/public/product-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const p = new URL(request.url).searchParams.get("p") ?? "";
        if (!PATH_RE.test(p)) return new Response("Not found", { status: 404 });
        const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !key) return new Response("Not configured", { status: 500 });
        const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
        const { data, error } = await sb.storage.from("product-images").createSignedUrl(p, 300);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(null, { status: 302, headers: { Location: data.signedUrl, "Cache-Control": "private, max-age=240" } });
      },
    },
  },
});
