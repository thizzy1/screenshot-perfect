import { supabase } from '@/integrations/supabase/client';
import type { Lang } from './i18n';

export interface StandardCategory {
  slug: string;
  name: string;
  nameId: string;
  sizeMode: 'footwear' | 'apparel' | 'one-size';
  supportsKids: boolean;
}

/**
 * 8 Standard Categories for Seaport:
 * 1. Basketball Shoes (slug: 'basketball' or 'basketball-shoes')
 * 2. Running (slug: 'running')
 * 3. Football Cleats (slug: 'football-cleats')
 * 4. Apparel (slug: 'apparel')
 * 5. Badminton (slug: 'badminton')
 * 6. Cycling (slug: 'cycling')
 * 7. Accessories (slug: 'accessories')
 * 8. Others (slug: 'others')
 */
export const STANDARD_CATEGORIES: readonly StandardCategory[] = [
  {
    slug: 'basketball',
    name: 'Basketball Shoes',
    nameId: 'Sepatu Basket',
    sizeMode: 'footwear',
    supportsKids: true,
  },
  {
    slug: 'running',
    name: 'Running',
    nameId: 'Lari',
    sizeMode: 'footwear',
    supportsKids: true,
  },
  {
    slug: 'football-cleats',
    name: 'Football Cleats',
    nameId: 'Sepatu Bola',
    sizeMode: 'footwear',
    supportsKids: true,
  },
  {
    slug: 'apparel',
    name: 'Apparel',
    nameId: 'Pakaian',
    sizeMode: 'apparel',
    supportsKids: false,
  },
  {
    slug: 'badminton',
    name: 'Badminton',
    nameId: 'Badminton',
    sizeMode: 'footwear',
    supportsKids: false,
  },
  {
    slug: 'cycling',
    name: 'Cycling',
    nameId: 'Sepeda',
    sizeMode: 'footwear',
    supportsKids: false,
  },
  {
    slug: 'accessories',
    name: 'Accessories',
    nameId: 'Aksesoris',
    sizeMode: 'one-size',
    supportsKids: false,
  },
  {
    slug: 'others',
    name: 'Others',
    nameId: 'Lainnya',
    sizeMode: 'one-size',
    supportsKids: false,
  },
] as const;

export interface MergedCategory {
  id: string;
  slug: string;
  name: string;
  nameId?: string | undefined;
}

/**
 * Merges categories fetched from Supabase with the central STANDARD_CATEGORIES configuration.
 * Preserves Supabase UUIDs when available, while ensuring all standard categories are available.
 */
export function mergeCategories(
  dbCategories?: Array<{ id: string; name: string; slug: string } | null> | null
): MergedCategory[] {
  const result: MergedCategory[] = [];
  const seenSlugs = new Set<string>();

  // 1. Add categories from database first (preserves their real Supabase UUIDs)
  if (dbCategories) {
    for (const cat of dbCategories) {
      if (!cat || !cat.slug) continue;
      const normalizedSlug = normalizeCategorySlug(cat.slug);
      seenSlugs.add(normalizedSlug);

      const standard = STANDARD_CATEGORIES.find(
        (s) => s.slug === normalizedSlug || (s.slug === 'basketball' && normalizedSlug === 'basketball-shoes')
      );

      result.push({
        id: cat.id,
        slug: cat.slug,
        name: standard?.name ?? cat.name,
        nameId: standard?.nameId,
      });
    }
  }

  // 2. Append any standard categories that aren't yet in the database
  for (const std of STANDARD_CATEGORIES) {
    if (!seenSlugs.has(std.slug) && !(std.slug === 'basketball' && seenSlugs.has('basketball-shoes'))) {
      result.push({
        id: std.slug, // fallback id until created in DB
        slug: std.slug,
        name: std.name,
        nameId: std.nameId,
      });
      seenSlugs.add(std.slug);
    }
  }

  return result;
}

/**
 * Normalizes category slugs for consistent lookup.
 */
export function normalizeCategorySlug(slugOrName?: string | null): string {
  if (!slugOrName) return '';
  const s = slugOrName.trim().toLowerCase().replace(/\s+/g, '-');
  if (s === 'basketball-shoes' || s === 'basketball') return 'basketball';
  if (s === 'football' || s === 'football-cleats' || s === 'soccer' || s === 'cleats') return 'football-cleats';
  if (s === 'accessory' || s === 'accessories') return 'accessories';
  if (s === 'other' || s === 'others') return 'others';
  return s;
}

/**
 * Mapping table for EN ↔ ID translations of categories and genders.
 */
export const CATEGORY_TRANSLATIONS: Record<string, { en: string; id: string }> = {
  all: { en: 'All', id: 'Semua' },
  accessories: { en: 'Accessories', id: 'Aksesoris' },
  apparel: { en: 'Apparel', id: 'Pakaian' },
  badminton: { en: 'Badminton', id: 'Badminton' },
  basketball: { en: 'Basketball Shoes', id: 'Sepatu Basket' },
  'basketball-shoes': { en: 'Basketball Shoes', id: 'Sepatu Basket' },
  cycling: { en: 'Cycling', id: 'Sepeda' },
  'football-cleats': { en: 'Football Cleats', id: 'Sepatu Bola' },
  football: { en: 'Football Cleats', id: 'Sepatu Bola' },
  running: { en: 'Running', id: 'Lari' },
  others: { en: 'Others', id: 'Lainnya' },
  other: { en: 'Others', id: 'Lainnya' },
  men: { en: 'Men', id: 'Pria' },
  women: { en: 'Women', id: 'Wanita' },
  unisex: { en: 'Unisex', id: 'Unisex' },
  kids: { en: 'Kids', id: 'Anak' },
};

/**
 * Formats/translates a category slug or name into localized text (EN or ID).
 * If unknown, formats neatly with title case (never returns empty or broken).
 */
export function getCategoryLabel(slugOrName?: string | null, lang: Lang = 'id'): string {
  if (!slugOrName) return '';
  const normalized = normalizeCategorySlug(slugOrName);

  const direct = CATEGORY_TRANSLATIONS[normalized];
  if (direct) {
    return lang === 'id' ? direct.id : direct.en;
  }

  // Fallback: title case formatting
  return slugOrName
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

/**
 * Ensures that a category exists in the Supabase `categories` table and returns its UUID.
 * If the category does not exist yet (e.g. newly added standard category like 'football-cleats' or 'others'),
 * it inserts it into the database so the foreign key constraint on products.category_id is satisfied.
 */
export async function ensureCategoryInDb(slug: string, defaultName?: string): Promise<string | null> {
  if (!slug) return null;
  const normalized = normalizeCategorySlug(slug);

  // 1. Try finding existing category in DB
  const { data: existing } = await supabase
    .from('categories')
    .select('id, slug')
    .or(`slug.eq.${slug},slug.eq.${normalized}`)
    .maybeSingle();

  if (existing?.id) {
    return existing.id;
  }

  // 2. If missing, look up standard name
  const std = STANDARD_CATEGORIES.find((s) => s.slug === normalized);
  const nameToInsert = defaultName ?? std?.name ?? getCategoryLabel(slug, 'en');

  // 3. Insert into Supabase categories
  try {
    const { data: inserted, error } = await supabase
      .from('categories')
      .insert({
        name: nameToInsert,
        slug: normalized,
      })
      .select('id')
      .single();

    if (error) {
      // If error (e.g. concurrent insert conflict), try fetching again
      const { data: fallback } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', normalized)
        .maybeSingle();
      return fallback?.id ?? null;
    }

    return inserted?.id ?? null;
  } catch {
    return null;
  }
}
