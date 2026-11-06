import type { SupabaseClient } from "npm:@supabase/supabase-js@2.119.0";
import { sanitizeJpeg } from "./jpeg.ts";
/** Immutable reviewed object: clients cannot write this bucket, and re-processing cannot overwrite it. */
export async function preparePhoto(admin: SupabaseClient, id: string) {
  const row = await admin
    .from("photos")
    .select("id,owner_id,object_path,content_revision,sanitized_at")
    .eq("id", id)
    .single();
  if (row.error) throw row.error;
  const p = row.data;
  const output = p.owner_id + "/" + p.content_revision + ".jpg";
  let reviewed = await admin.storage.from("reviewed-photos").download(output);
  if (reviewed.error) {
    const source = await admin.storage
      .from("community-photos")
      .download(p.object_path);
    if (source.error) throw source.error;
    const clean = sanitizeJpeg(new Uint8Array(await source.data.arrayBuffer()));
    if (!clean) throw new Error("Invalid JPEG");
    const write = await admin.storage
      .from("reviewed-photos")
      .upload(output, clean, { contentType: "image/jpeg", upsert: false });
    if (write.error) {
      reviewed = await admin.storage.from("reviewed-photos").download(output);
      if (reviewed.error) throw write.error;
    } else
      reviewed = await admin.storage.from("reviewed-photos").download(output);
  }
  if (reviewed.error || !reviewed.data)
    throw new Error("Reviewed object unavailable");
  const receipt = await admin
    .from("photos")
    .update({ sanitized_at: new Date().toISOString() })
    .eq("id", id)
    .eq("content_revision", p.content_revision);
  if (receipt.error) throw receipt.error;
  return new Uint8Array(await reviewed.data.arrayBuffer());
}
