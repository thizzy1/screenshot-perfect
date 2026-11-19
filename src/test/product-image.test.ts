import { beforeEach, describe, expect, it, vi } from "vitest";

const storageMock = vi.hoisted(() => ({
  from: vi.fn(),
  createSignedUrl: vi.fn(),
  getPublicUrl: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { storage: { from: storageMock.from } },
}));

import {
  extractProductImageSource,
  resolveProductImageFallbackUrl,
  resolveProductImageUrl,
} from "@/lib/product-image";

describe("product image sources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageMock.from.mockReturnValue({
      createSignedUrl: storageMock.createSignedUrl,
      getPublicUrl: storageMock.getPublicUrl,
    });
    storageMock.createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://example.test/signed-image.png" },
      error: null,
    });
    storageMock.getPublicUrl.mockReturnValue({
      data: { publicUrl: "https://example.test/public-image.png" },
    });
  });

  it("extracts strings and URL or path objects", () => {
    expect(extractProductImageSource("  https://example.test/image.png  ")).toBe(
      "https://example.test/image.png",
    );
    expect(extractProductImageSource({ url: "products/image.png" })).toBe("products/image.png");
    expect(extractProductImageSource({ path: "products/image.png" })).toBe("products/image.png");
    expect(extractProductImageSource({ url: "" })).toBeUndefined();
  });

  it("preserves complete non-storage URLs without contacting storage", async () => {
    const url = "https://example.test/image.png";

    await expect(resolveProductImageUrl(url)).resolves.toBe(url);
    expect(storageMock.from).not.toHaveBeenCalled();
  });

  it("signs a relative product storage path", async () => {
    await expect(resolveProductImageUrl("product-images/products/shoe.png")).resolves.toBe(
      "https://example.test/signed-image.png",
    );

    expect(storageMock.from).toHaveBeenCalledWith("product-images");
    expect(storageMock.createSignedUrl).toHaveBeenCalledWith("products/shoe.png", 3600);
  });

  it("refreshes expired signed URLs after removing token query parameters", async () => {
    const expiredUrl =
      "https://gacfmsnjscwflpaovwkq.supabase.co/storage/v1/object/sign/product-images/user-1/team-thermal.png?token=expired";

    await expect(resolveProductImageUrl(expiredUrl)).resolves.toBe(
      "https://example.test/signed-image.png",
    );
    expect(storageMock.createSignedUrl).toHaveBeenCalledWith("user-1/team-thermal.png", 3600);
  });

  it("uses the public storage URL if signing fails", async () => {
    storageMock.createSignedUrl.mockResolvedValue({
      data: null,
      error: new Error("Signing unavailable"),
    });

    await expect(resolveProductImageUrl("products/public-shoe.png")).resolves.toBe(
      "https://example.test/public-image.png",
    );
    expect(storageMock.getPublicUrl).toHaveBeenCalledWith("products/public-shoe.png");
  });

  it("falls back between public and fresh signed storage URLs", async () => {
    const source = "product-images/user-2/shoe.png";

    await expect(
      resolveProductImageFallbackUrl(source, "https://example.test/signed-image.png"),
    ).resolves.toBe("https://example.test/public-image.png");
    await expect(
      resolveProductImageFallbackUrl(source, "https://example.test/public-image.png"),
    ).resolves.toBe("https://example.test/signed-image.png");
    expect(storageMock.createSignedUrl).toHaveBeenCalledWith("user-2/shoe.png", 3600);
  });

  it("does not resolve empty or unsupported object sources", async () => {
    await expect(resolveProductImageUrl("")).resolves.toBeUndefined();
    await expect(resolveProductImageUrl({ id: "image-1" })).resolves.toBeUndefined();
    expect(storageMock.from).not.toHaveBeenCalled();
  });
});
