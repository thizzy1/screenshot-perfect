export const adultShoeSizes = ['39', '40', '41', '42', '43', '44', '45'] as const;
export const kidsShoeSizes = ['29', '30', '31', '32', '33', '34', '35', '36', '37'] as const;
export const apparelSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export type SizeGroup = 'adult' | 'kids' | 'apparel';
export function sizesFor(group: SizeGroup): readonly string[] {
  return group === 'kids' ? kidsShoeSizes : group === 'apparel' ? apparelSizes : adultShoeSizes;
}
export function sizeLabel(size: string | null) {
  return size && /^\d+$/.test(size) ? `EU ${size}` : size ?? '';
}