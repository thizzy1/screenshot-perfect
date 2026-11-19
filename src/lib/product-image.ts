import { supabase } from "@/integrations/supabase/client";

export const productImageFrameClass =
  'border border-black/5 bg-[#F5F5F5] dark:border-white/10 dark:bg-[#1A1A1E]';

export function productImageBlendClass(src?: string | null): string {
  return src ? 'mix-blend-multiply dark:mix-blend-normal' : '';
}

const PRODUCT_IMAGE_BUCKET = "product-images";
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const SIGNED_URL_REFRESH_BUFFER_MS = 60 * 1000;
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const pendingSignedUrlCache = new Map<string, Promise<string>>();

export function extractProductImageSource(value: unknown): string | undefined {
  if (typeof value === "string") {
    const source = value.trim();
    return source || undefined;
  }
  if (typeof value !== "object" || value === null) return undefined;

  if ("url" in value) {
    const source = extractProductImageSource(value.url);
    if (source) return source;
  }
  if ("path" in value) return extractProductImageSource(value.path);
  return undefined;
}

function decodeStoragePath(path: string): string {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

function storageObjectPath(source: string): string | undefined {
  let pathname = source;
  if (/^https?:\/\//i.test(source)) {
    try {
      pathname = new URL(source).pathname;
    } catch {
      return undefined;
    }
  } else if (/^[a-z][a-z\d+.-]*:/i.test(source) || source.startsWith("//")) {
    return undefined;
  }

  pathname = pathname.split(/[?#]/, 1)[0] ?? "";
  const normalized = pathname.replace(/^\/+/, "");
  const storagePrefix = "storage/v1/object/";
  if (normalized.startsWith(storagePrefix)) {
    const [endpoint, bucket, ...filePath] = normalized.slice(storagePrefix.length).split("/");
    if (
      !["sign", "public", "authenticated"].includes(endpoint ?? "") ||
      bucket !== PRODUCT_IMAGE_BUCKET ||
      filePath.length === 0
    ) {
      return undefined;
    }
    return decodeStoragePath(filePath.join("/"));
  }

  const bucketPrefix = `${PRODUCT_IMAGE_BUCKET}/`;
  if (normalized.startsWith(bucketPrefix)) {
    return decodeStoragePath(normalized.slice(bucketPrefix.length));
  }
  if (pathname.startsWith("/")) return undefined;
  if (/^https?:\/\//i.test(source)) return undefined;
  return decodeStoragePath(normalized);
}

async function createSignedUrl(path: string, refresh = false): Promise<string> {
  if (refresh) signedUrlCache.delete(path);
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt - Date.now() > SIGNED_URL_REFRESH_BUFFER_MS) {
    return cached.url;
  }

  let pending = pendingSignedUrlCache.get(path);
  if (!pending) {
    pending = supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
      .then(({ data, error }) => {
        if (error) throw error;
        if (!data?.signedUrl) throw new Error("Supabase Storage returned an empty signed image URL.");
        signedUrlCache.set(path, {
          url: data.signedUrl,
          expiresAt: Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
        });
        return data.signedUrl;
      });
    pendingSignedUrlCache.set(path, pending);
  }

  try {
    return await pending;
  } finally {
    if (pendingSignedUrlCache.get(path) === pending) pendingSignedUrlCache.delete(path);
  }
}

export async function resolveProductImageUrl(value: unknown): Promise<string | undefined> {
  const source = extractProductImageSource(value);
  if (!source) return undefined;

  const isHttpUrl = /^https?:\/\//i.test(source);
  if (
    !isHttpUrl &&
    (source.startsWith("//") || /^data:image\//i.test(source) || source.startsWith("blob:"))
  ) {
    return source;
  }

  const path = storageObjectPath(source);
  if (path) {
    try {
      return await createSignedUrl(path);
    } catch (error) {
      const publicUrl = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
      if (publicUrl) return publicUrl;
      throw error;
    }
  }

  if (isHttpUrl) return source;
  if (source.startsWith("/")) return source;
  return undefined;
}

export async function resolveProductImageFallbackUrl(
  value: unknown,
  failedUrl: string,
): Promise<string | undefined> {
  const source = extractProductImageSource(value);
  if (!source) return undefined;

  const path = storageObjectPath(source);
  if (!path) return undefined;

  const publicUrl = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  if (publicUrl && publicUrl !== failedUrl) return publicUrl;

  return createSignedUrl(path, true);
}
