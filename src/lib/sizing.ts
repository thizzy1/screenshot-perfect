export const adultShoeSizes = ['39', '40', '41', '42', '43', '44', '45'] as const;
export const kidsShoeSizes = ['29', '30', '31', '32', '33', '34', '35', '36', '37'] as const;
export const apparelSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export const oneSizeValue = 'One Size' as const;
export type SizeGroup = 'adult' | 'kids' | 'apparel';
export type CategorySizeMode = 'footwear' | 'apparel' | 'one-size';

export function isAccessoriesCategory(categorySlug?: string | null): boolean {
  const normalized = categorySlug?.trim().toLowerCase();
  return normalized === 'accessory' || normalized === 'accessories';
}

export function sizesFor(group: SizeGroup): readonly string[] {
  return group === 'kids' ? kidsShoeSizes : group === 'apparel' ? apparelSizes : adultShoeSizes;
}

export function sizeModeForCategory(categorySlug?: string | null, explicitMode?: string | null): CategorySizeMode {
  if (isAccessoriesCategory(categorySlug)) return 'one-size';
  const normalized = (explicitMode ?? categorySlug ?? '').toLowerCase();
  if (normalized === 'apparel') return 'apparel';
  if (normalized === 'one-size' || normalized === 'equipment' || normalized === 'accessories') return 'one-size';
  if (normalized === 'badminton' || normalized === 'cycling') return 'footwear';
  return 'footwear';
}

export function sizeOptionsForMode(mode: CategorySizeMode, group: SizeGroup = 'adult'): readonly string[] {
  if (mode === 'apparel') return apparelSizes;
  if (mode === 'one-size') return [oneSizeValue];
  return sizesFor(group);
}

export function sizeLabel(size: string | null) {
  return size && /^\d+$/.test(size) ? `EU ${size}` : size ?? '';
}

export interface ApparelSizeGuide {
  size: (typeof apparelSizes)[number];
  chestWidth: string;
  length: string;
  recommendation: string;
}

export const apparelSizeGuide: readonly ApparelSizeGuide[] = [
  { size: 'XS', chestWidth: '46 cm', length: '66 cm', recommendation: 'Tinggi 155–162 cm' },
  { size: 'S', chestWidth: '48 cm', length: '68 cm', recommendation: 'Tinggi 160–168 cm' },
  { size: 'M', chestWidth: '50 cm', length: '70 cm', recommendation: 'Tinggi 165–173 cm' },
  { size: 'L', chestWidth: '53 cm', length: '73 cm', recommendation: 'Tinggi 170–178 cm' },
  { size: 'XL', chestWidth: '56 cm', length: '76 cm', recommendation: 'Tinggi 175–183 cm' },
  { size: 'XXL', chestWidth: '59 cm', length: '79 cm', recommendation: 'Tinggi 180–190 cm' },
];

export interface ShoeSizeGuide {
  eu: string;
  us: string;
  uk: string;
  insole: string;
  outsole: string;
}

export const adultShoeSizeGuide: readonly ShoeSizeGuide[] = [
  { eu: '36', us: '4.5', uk: '3.5', insole: '22.5 cm', outsole: '±24.5 cm' },
  { eu: '37', us: '5', uk: '4', insole: '23.0 cm', outsole: '±25.0 cm' },
  { eu: '38', us: '5.5', uk: '4.5', insole: '24.0 cm', outsole: '±26.0 cm' },
  { eu: '39', us: '6.5', uk: '5.5', insole: '24.5 cm', outsole: '±26.5 cm' },
  { eu: '40', us: '7', uk: '6', insole: '25.0 cm', outsole: '±27.0 cm' },
  { eu: '41', us: '8', uk: '7', insole: '26.0 cm', outsole: '±28.0 cm' },
  { eu: '42', us: '8.5', uk: '7.5', insole: '26.5 cm', outsole: '±28.5 cm' },
  { eu: '43', us: '9.5', uk: '8.5', insole: '27.5 cm', outsole: '±29.5 cm' },
  { eu: '44', us: '10', uk: '9', insole: '28.0 cm', outsole: '±30.0 cm' },
  { eu: '45', us: '11', uk: '10', insole: '29.0 cm', outsole: '±31.0 cm' },
];

export const kidsShoeSizeGuide: readonly ShoeSizeGuide[] = [
  { eu: '29', us: '11.5C', uk: '11C', insole: '18.0 cm', outsole: '±24.3 cm' },
  { eu: '30', us: '12C', uk: '11.5C', insole: '18.5 cm', outsole: '±20.3 cm' },
  { eu: '31', us: '13C', uk: '12.5C', insole: '19.5 cm', outsole: '±21.3 cm' },
  { eu: '32', us: '1Y', uk: '13.5C', insole: '20.0 cm', outsole: '±21.8 cm' },
  { eu: '33', us: '1.5Y', uk: '1', insole: '20.5 cm', outsole: '±22.3 cm' },
  { eu: '34', us: '2.5Y', uk: '2', insole: '21.5 cm', outsole: '±23.3 cm' },
  { eu: '35', us: '3Y', uk: '2.5', insole: '22.0 cm', outsole: '±23.8 cm' },
  { eu: '36', us: '4Y', uk: '3.5', insole: '22.5 cm', outsole: '±24.3 cm' },
  { eu: '37', us: '4.5Y', uk: '4', insole: '23.0 cm', outsole: '±24.8 cm' },
];

export function compareSizes(a: string, b: string): number {
  const numA = Number(a);
  const numB = Number(b);
  if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
  const apparelOrder: Record<string, number> = {
    XXS: 1,
    XS: 2,
    S: 3,
    M: 4,
    L: 5,
    XL: 6,
    XXL: 7,
    '2XL': 7,
    '3XL': 8,
  };
  const ordA = apparelOrder[a.toUpperCase()];
  const ordB = apparelOrder[b.toUpperCase()];
  if (ordA && ordB) return ordA - ordB;
  return a.localeCompare(b);
}

export function sortVariantSizes<T extends { size: string }>(variants: T[]): T[] {
  return [...variants].sort((a, b) => compareSizes(a.size, b.size));
}

