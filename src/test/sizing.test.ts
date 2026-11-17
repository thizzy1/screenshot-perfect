import { describe, expect, it } from 'vitest';
import { sizesFor, sizeLabel } from '@/lib/sizing';
describe('Product sizing', () => {
  it('limits adult shoes to EU 39 through 45', () => expect(sizesFor('adult')).toEqual(['39','40','41','42','43','44','45']));
  it('limits kids shoes to EU 29 through 37', () => expect(sizesFor('kids')).toEqual(['29','30','31','32','33','34','35','36','37']));
  it('does not label apparel as European shoe sizes', () => expect(sizeLabel('M')).toBe('M'));
});