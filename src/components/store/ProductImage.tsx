import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import {
  extractProductImageSource,
  resolveProductImageFallbackUrl,
  resolveProductImageUrl,
} from "@/lib/product-image";

type ProductImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: unknown;
};

export function ProductImage({ src, onError, ...props }: ProductImageProps) {
  const source = extractProductImageSource(src);
  const [resolvedUrl, setResolvedUrl] = useState<string>();
  const [failedUrl, setFailedUrl] = useState<string>();
  const [fallbackCount, setFallbackCount] = useState(0);

  useEffect(() => {
    let active = true;
    setResolvedUrl(undefined);
    setFailedUrl(undefined);
    setFallbackCount(0);
    if (!source) return;

    void resolveProductImageUrl(source)
      .then((url) => {
        if (active) setResolvedUrl(url);
      })
      .catch((error: unknown) => {
        console.warn("Could not resolve a product image URL.", error);
        if (active) setResolvedUrl(undefined);
      });

    return () => {
      active = false;
    };
  }, [source]);

  if (!resolvedUrl || failedUrl === resolvedUrl) return null;

  return (
    <img
      {...props}
      className={cn("relative z-10 block h-full w-full opacity-100", props.className)}
      src={resolvedUrl}
      onError={(event) => {
        onError?.(event);
        if (fallbackCount >= 2) {
          setFailedUrl(resolvedUrl);
          return;
        }

        const failedUrl = resolvedUrl;
        setFallbackCount((count) => count + 1);
        void resolveProductImageFallbackUrl(source, failedUrl)
          .then((fallbackUrl) => {
            if (!fallbackUrl || fallbackUrl === failedUrl) {
              setFailedUrl(failedUrl);
              return;
            }
            setResolvedUrl(fallbackUrl);
          })
          .catch((error: unknown) => {
            console.warn("Could not resolve a fallback product image URL.", error);
            setFailedUrl(failedUrl);
          });
      }}
    />
  );
}
