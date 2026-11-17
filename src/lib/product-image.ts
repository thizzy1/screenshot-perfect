export const productImageFrameClass =
  'border border-black/5 bg-[#F5F5F5] dark:border-white/10 dark:bg-[#1A1A1E]';

export function productImageBlendClass(src?: string | null): string {
  return src ? 'mix-blend-multiply dark:mix-blend-normal' : '';
}
