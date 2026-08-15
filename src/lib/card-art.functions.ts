import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface UploadInput {
  characterId: string;
  contentType: string;
  /** base64 payload without the data: prefix */
  dataBase64: string;
}

/**
 * Admin-only card artwork upload. Authorization is re-checked server side via
 * `am_i_admin` using the caller's own (RLS-bound) client — never trusted from
 * the browser.
 */
export const uploadCardArt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: UploadInput) => {
    if (!input?.characterId || !/^[a-z0-9-]+$/.test(input.characterId)) throw new Error("bad_character");
    if (!/^image\/(png|jpeg|webp)$/.test(input.contentType ?? "")) throw new Error("bad_type");
    if (!input.dataBase64 || input.dataBase64.length > 8_000_000) throw new Error("bad_size");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("am_i_admin" as never);
    if (isAdmin !== true) throw new Error("Forbidden");

    const ext = data.contentType === "image/png" ? "png" : data.contentType === "image/webp" ? "webp" : "jpg";
    const file = `${data.characterId}-${Date.now()}.${ext}`;
    const bytes = Buffer.from(data.dataBase64, "base64");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("card-art")
      .upload(file, bytes, { contentType: data.contentType, upsert: true });
    if (error) throw new Error(error.message);

    return { url: `/api/public/card-art/${file}` };
  });