import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearCatalogCache, fetchCachedCatalog } from "@/lib/catalog-cache";
import { validateDatabaseBackup } from "@/lib/database-backup";

describe("product catalog cache", () => {
  beforeEach(async () => {
    await clearCatalogCache();
    localStorage.clear();
  });

  it("measures a database miss followed by a cached hit", async () => {
    const fetchFromDatabase = vi.fn().mockResolvedValue([{ id: "product-1" }]);

    const first = await fetchCachedCatalog({ sort: "new" }, fetchFromDatabase);
    const second = await fetchCachedCatalog({ sort: "new" }, fetchFromDatabase);

    expect(first.metrics.status).toBe("CACHE MISS (Database Query)");
    expect(second.metrics.status).toBe("CACHE HIT (Cached)");
    expect(first.metrics.responseTimeMs).toBeGreaterThanOrEqual(0);
    expect(second.data).toEqual(first.data);
    expect(fetchFromDatabase).toHaveBeenCalledTimes(1);
  });

  it("performs a new query after clearing cache", async () => {
    const fetchFromDatabase = vi.fn().mockResolvedValue([]);

    await fetchCachedCatalog({}, fetchFromDatabase);
    await clearCatalogCache();
    const result = await fetchCachedCatalog({}, fetchFromDatabase);

    expect(result.metrics.status).toBe("CACHE MISS (Database Query)");
    expect(fetchFromDatabase).toHaveBeenCalledTimes(2);
  });
});

describe("database backup validation", () => {
  const validBackup = {
    format: "seaport-database-backup",
    version: 1,
    generatedAt: "2026-11-19T00:00:00.000Z",
    tables: {
      categories: [{ id: "category-1", name: "Shoes", slug: "shoes" }],
      products: [
        {
          id: "product-1",
          category_id: "category-1",
          store_id: "store-1",
          name: "Shoes",
          slug: "shoes",
          price: 100,
        },
      ],
      product_variants: [{ id: "variant-1", product_id: "product-1", size: "42", stock: 5 }],
      orders: [
        {
          id: "order-1",
          order_number: "SP-1",
          checkout_id: "checkout-1",
          customer_id: "customer-1",
          store_id: "store-1",
          status: "paid",
          subtotal: 100,
          shipping_fee: 0,
          total: 100,
          commission: 5,
        },
      ],
      order_items: [
        {
          id: "item-1",
          order_id: "order-1",
          product_id: "product-1",
          variant_id: "variant-1",
          name: "Shoes",
          price: 100,
          quantity: 1,
        },
      ],
    },
  };

  it("accepts complete data with valid foreign-key references", () => {
    const result = validateDatabaseBackup(validBackup);

    expect(result.valid).toBe(true);
    if (result.valid) expect(result.counts["order_items"]).toBe(1);
  });

  it("rejects dangling references without changing data", () => {
    const invalidBackup = structuredClone(validBackup);
    invalidBackup.tables.order_items[0]!.order_id = "missing-order";

    const result = validateDatabaseBackup(invalidBackup);

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors[0]).toContain("references an order");
  });

  it("rejects rows with missing required schema fields", () => {
    const invalidBackup: unknown = {
      ...validBackup,
      tables: {
        ...validBackup.tables,
        products: [
          {
            id: "product-1",
            category_id: "category-1",
            store_id: "store-1",
            slug: "shoes",
            price: 100,
          },
        ],
      },
    };

    const result = validateDatabaseBackup(invalidBackup);

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors[0]).toContain('string field "name"');
  });
});
