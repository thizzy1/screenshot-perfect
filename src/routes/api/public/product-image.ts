import { createFileRoute } from "@tanstack/react-router";

const PATH_RE = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.[a-z0-9]{1,5}$/i;

// Serves product images only while the uploader is an admin or owns a verified store.
export const Route = createFileRoute("/api/public/product-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const p = new URL(request.url).searchParams.get("p") ?? "";
        if (!PATH_RE.test(p)) return new Response("Not found", { status: 404 });
        const owner = p.split("/")[0];
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const [{ data: store }, { data: admin }] = await Promise.all([
          supabaseAdmin.from("stores").select("id").eq("owner_id", owner).eq("status", "verified").limit(1).maybeSingle(),
          supabaseAdmin.from("user_roles").select("id").eq("user_id", owner).eq("role", "admin").limit(1).maybeSingle(),
        ]);
        if (!store && !admin) return new Response("Not found", { status: 404 });
        const { data, error } = await supabaseAdmin.storage.from("product-images").createSignedUrl(p, 300);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(null, { status: 302, headers: { Location: data.signedUrl, "Cache-Control": "private, max-age=240" } });
      },
    },
  },
});
