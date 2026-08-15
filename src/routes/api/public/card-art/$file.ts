import { createFileRoute } from "@tanstack/react-router";

/** Public read-only proxy for admin-uploaded card artwork (private bucket). */
export const Route = createFileRoute("/api/public/card-art/$file")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const file = params.file;
        if (!/^[A-Za-z0-9._-]+$/.test(file)) return new Response("Bad request", { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("card-art").download(file);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(await data.arrayBuffer(), {
          headers: {
            "Content-Type": data.type || "image/jpeg",
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});