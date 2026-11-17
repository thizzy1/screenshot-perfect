import React, { useEffect, useState } from "react";

const cutoutCache = new Map<string, string>();

interface CutoutImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  className?: string;
}

/** Read RGBA safely from a Uint8ClampedArray (noUncheckedIndexedAccess-safe). */
function px(d: Uint8ClampedArray, idx: number): [number, number, number, number] {
  return [d[idx] ?? 0, d[idx + 1] ?? 0, d[idx + 2] ?? 0, d[idx + 3] ?? 255];
}

export function CutoutImage({ src, alt = "", className, ...props }: CutoutImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(() => cutoutCache.get(src) || src);

  useEffect(() => {
    if (!src) return;
    if (cutoutCache.has(src)) {
      setCurrentSrc(cutoutCache.get(src)!);
      return;
    }

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      try {
        const maxDim = 1200;
        let { naturalWidth: width, naturalHeight: height } = img;
        if (!width || !height) return;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const d = imgData.data;

        // Sample the 4 corners to detect background color
        const corners = [
          0,
          (width - 1) * 4,
          (height - 1) * width * 4,
          ((height - 1) * width + (width - 1)) * 4,
        ];

        let sumR = 0, sumG = 0, sumB = 0, count = 0;
        for (const idx of corners) {
          const [r, g, b, a] = px(d, idx);
          if (a > 200 && r > 215 && g > 215 && b > 215) {
            sumR += r;
            sumG += g;
            sumB += b;
            count++;
          }
        }

        // If background is detected as light/near-white
        if (count >= 2) {
          const bgR = sumR / count;
          const bgG = sumG / count;
          const bgB = sumB / count;

          for (let i = 0; i < d.length; i += 4) {
            const [r, g, b, a] = px(d, i);
            if (a === 0) continue;

            const diffR = r - bgR;
            const diffG = g - bgG;
            const diffB = b - bgB;
            const dist = Math.sqrt(diffR * diffR + diffG * diffG + diffB * diffB);

            const isNearWhite = r > 236 && g > 236 && b > 236;

            if (dist < 32 || isNearWhite) {
              d[i + 3] = 0;
            } else if (dist < 48) {
              const factor = (dist - 32) / 16;
              d[i + 3] = Math.round(a * factor);
            }
          }

          ctx.putImageData(imgData, 0, 0);
          const dataUrl = canvas.toDataURL("image/png");
          cutoutCache.set(src, dataUrl);
          if (isMounted) setCurrentSrc(dataUrl);
        } else {
          // Already transparent or non-white background
          cutoutCache.set(src, src);
          if (isMounted) setCurrentSrc(src);
        }
      } catch {
        // Fallback gracefully on CORS or canvas errors
        if (isMounted) setCurrentSrc(src);
      }
    };

    img.onerror = () => {
      if (isMounted) setCurrentSrc(src);
    };

    return () => {
      isMounted = false;
    };
  }, [src]);

  return <img src={currentSrc} alt={alt} className={className} {...props} />;
}
