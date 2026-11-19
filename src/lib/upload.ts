import { supabase } from "@/integrations/supabase/client";

export async function uploadProductImage(file: File, userId: string) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  if (file.size > 5 * 1024 * 1024) throw new Error("Images must be under 5 MB");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
  if (error) throw error;
  // Served through a checked, short-lived link instead of a long-lived signed URL.
  return `/api/public/product-image?p=${encodeURIComponent(path)}`;
}
