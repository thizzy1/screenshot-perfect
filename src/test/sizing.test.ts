import { describe, expect, it } from 'vitest';
import {
  sizesFor,
  sizeLabel,
  apparelSizeGuide,
  adultShoeSizeGuide,
  kidsShoeSizeGuide,
  compareSizes,
  sortVariantSizes,
  sizeModeForCategory,
  isAccessoriesCategory,
  isOthersCategory,
  oneSizeValue,
} from '@/lib/sizing';
import {
  STANDARD_CATEGORIES,
  getCategoryLabel,
  mergeCategories,
  normalizeCategorySlug,
} from '@/lib/categories';

describe('Product sizing and categories', () => {
  it('limits adult shoes to EU 39 through 45', () =>
    expect(sizesFor('adult')).toEqual(['39', '40', '41', '42', '43', '44', '45']));

  it('limits kids shoes to EU 29 through 37', () =>
    expect(sizesFor('kids')).toEqual(['29', '30', '31', '32', '33', '34', '35', '36', '37']));

  it('does not label apparel as European shoe sizes', () =>
    expect(sizeLabel('M')).toBe('M'));

  it('forces accessories into one-size mode regardless of explicit metadata', () => {
    expect(isAccessoriesCategory('Accessories')).toBe(true);
    expect(sizeModeForCategory('accessories', 'footwear')).toBe('one-size');
  });

  it('treats Football Cleats as footwear mode', () => {
    expect(sizeModeForCategory('football-cleats')).toBe('footwear');
    expect(sizeModeForCategory('football')).toBe('footwear');
  });

  it('defaults Others to one-size mode while allowing flexible overrides', () => {
    expect(isOthersCategory('Others')).toBe(true);
    expect(isOthersCategory('others')).toBe(true);
    expect(sizeModeForCategory('others')).toBe('one-size');
    expect(sizeModeForCategory('others', 'footwear')).toBe('footwear');
  });

  it('supports one-size equipment variants in badminton and cycling', () => {
    expect(sizeModeForCategory('badminton', 'one-size')).toBe('one-size');
    expect(sizeModeForCategory('cycling', 'one-size')).toBe('one-size');
    expect(sizeLabel(oneSizeValue)).toBe('One Size');
  });

  it('translates all 8 standard categories accurately in ID and EN', () => {
    expect(getCategoryLabel('football-cleats', 'id')).toBe('Sepatu Bola');
    expect(getCategoryLabel('football-cleats', 'en')).toBe('Football Cleats');
    expect(getCategoryLabel('others', 'id')).toBe('Lainnya');
    expect(getCategoryLabel('others', 'en')).toBe('Others');
    expect(getCategoryLabel('basketball', 'id')).toBe('Sepatu Basket');
    expect(getCategoryLabel('running', 'id')).toBe('Lari');
    expect(getCategoryLabel('all', 'id')).toBe('Semua');
    expect(getCategoryLabel('all', 'en')).toBe('All');
  });

  it('cleanly formats fallback unknown categories', () => {
    expect(getCategoryLabel('padel-tennis', 'id')).toBe('Padel Tennis');
  });

  it('merges database categories with all 8 standard categories', () => {
    const dbSample = [
      { id: '11111111-1111-4111-8111-111111111111', name: 'Basketball Shoes', slug: 'basketball' },
    ];
    const merged = mergeCategories(dbSample);
    expect(merged.length).toBe(STANDARD_CATEGORIES.length);
    expect(merged.find((c) => c.slug === 'basketball')?.id).toBe('11111111-1111-4111-8111-111111111111');
    expect(merged.some((c) => c.slug === 'football-cleats')).toBe(true);
    expect(merged.some((c) => c.slug === 'others')).toBe(true);
  });

  it('provides comprehensive apparel size guide with chest width and length', () => {
    expect(apparelSizeGuide.length).toBe(6);
    expect(apparelSizeGuide.map((g) => g.size)).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
    expect(apparelSizeGuide.find((g) => g.size === 'M')?.chestWidth).toBe('50 cm');
  });

  it('provides footwear size guide with insole and outsole specs', () => {
    expect(adultShoeSizeGuide.length).toBe(10);
    expect(adultShoeSizeGuide.find((g) => g.eu === '42')?.insole).toBe('26.5 cm');
    expect(kidsShoeSizeGuide.find((g) => g.eu === '29')?.insole).toBe('18.0 cm');
  });

  it('sorts numeric shoe sizes ascending', () => {
    const raw = [{ size: '42' }, { size: '29' }, { size: '37' }, { size: '40' }];
    expect(sortVariantSizes(raw).map((v) => v.size)).toEqual(['29', '37', '40', '42']);
  });

  it('sorts apparel sizes from XS to XXL', () => {
    const raw = [{ size: 'XL' }, { size: 'XS' }, { size: 'M' }, { size: 'S' }];
    expect(sortVariantSizes(raw).map((v) => v.size)).toEqual(['XS', 'S', 'M', 'XL']);
  });
});

