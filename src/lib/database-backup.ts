import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const PAGE_SIZE = 1_000;
const BACKUP_FORMAT = "seaport-database-backup";

export type DatabaseBackup = {
  format: typeof BACKUP_FORMAT;
  version: 1;
  generatedAt: string;
  tables: {
    categories: Tables<"categories">[];
    products: Tables<"products">[];
    product_variants: Tables<"product_variants">[];
    orders: Tables<"orders">[];
    order_items: Tables<"order_items">[];
  };
};

type PageResponse<Row> = {
  data: Row[] | null;
  error: { message: string } | null;
};

async function fetchAllPages<Row>(
  fetchPage: (start: number, end: number) => Promise<PageResponse<Row>>,
): Promise<Row[]> {
  const rows: Row[] = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    const { data, error } = await fetchPage(start, start + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

export async function collectDatabaseBackup(): Promise<DatabaseBackup> {
  const [categories, products, product_variants, orders, order_items] = await Promise.all([
    fetchAllPages(async (start, end) => {
      const { data, error } = await supabase.from("categories").select("*").range(start, end);
      return { data, error };
    }),
    fetchAllPages(async (start, end) => {
      const { data, error } = await supabase.from("products").select("*").range(start, end);
      return { data, error };
    }),
    fetchAllPages(async (start, end) => {
      const { data, error } = await supabase.from("product_variants").select("*").range(start, end);
      return { data, error };
    }),
    fetchAllPages(async (start, end) => {
      const { data, error } = await supabase.from("orders").select("*").range(start, end);
      return { data, error };
    }),
    fetchAllPages(async (start, end) => {
      const { data, error } = await supabase.from("order_items").select("*").range(start, end);
      return { data, error };
    }),
  ]);

  return {
    format: BACKUP_FORMAT,
    version: 1,
    generatedAt: new Date().toISOString(),
    tables: { categories, products, product_variants, orders, order_items },
  };
}

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "string") return sqlString(value);
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string")) {
      return value.length
        ? `ARRAY[${value.map((item) => sqlString(item)).join(", ")}]`
        : "ARRAY[]::text[]";
    }
    return sqlString(JSON.stringify(value)) + "::jsonb";
  }
  if (typeof value === "object") return `${sqlString(JSON.stringify(value))}::jsonb`;
  throw new Error("Unsupported value in database backup.");
}

export function databaseBackupToSql(backup: DatabaseBackup) {
  const sections = Object.entries(backup.tables).map(([table, rows]) => {
    if (!rows.length) return `-- ${table}: no rows`;
    const columns = Object.keys(rows[0] as Record<string, unknown>);
    const statements = rows.map((row) => {
      const values = columns.map((column) => sqlValue((row as Record<string, unknown>)[column]));
      return `INSERT INTO public.${table} (${columns.join(", ")}) VALUES (${values.join(", ")});`;
    });
    return [`-- ${table}: ${rows.length} row(s)`, ...statements].join("\n");
  });
  return [
    "-- Seaport data export. Review constraints and access policies before importing.",
    `-- Generated: ${backup.generatedAt}`,
    "BEGIN;",
    ...sections,
    "COMMIT;",
    "",
  ].join("\n\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rowsFor(backup: unknown, table: string): Record<string, unknown>[] | null {
  if (!isRecord(backup) || !isRecord(backup["tables"])) return null;
  const rows = backup["tables"][table];
  if (!Array.isArray(rows) || !rows.every(isRecord)) return null;
  return rows;
}

function idSet(rows: Record<string, unknown>[]) {
  return new Set(rows.map((row) => row["id"]).filter((id): id is string => typeof id === "string"));
}

function hasUniqueIds(rows: Record<string, unknown>[]) {
  const ids = rows.map((row) => row["id"]);
  return ids.every((id) => typeof id === "string") && new Set(ids).size === ids.length;
}

export type BackupValidationResult =
  { valid: true; counts: Record<string, number> } | { valid: false; errors: string[] };

export function validateDatabaseBackup(value: unknown): BackupValidationResult {
  if (
    !isRecord(value) ||
    value["format"] !== BACKUP_FORMAT ||
    value["version"] !== 1 ||
    typeof value["generatedAt"] !== "string"
  ) {
    return { valid: false, errors: ["File format/version is not a supported Seaport backup."] };
  }

  const tableNames = [
    "categories",
    "products",
    "product_variants",
    "orders",
    "order_items",
  ] as const;
  const requiredStringFields: Record<(typeof tableNames)[number], string[]> = {
    categories: ["id", "name", "slug"],
    products: ["id", "store_id", "name", "slug"],
    product_variants: ["id", "product_id", "size"],
    orders: ["id", "order_number", "checkout_id", "customer_id", "store_id", "status"],
    order_items: ["id", "order_id", "name"],
  };
  const requiredNumberFields: Partial<Record<(typeof tableNames)[number], string[]>> = {
    products: ["price"],
    product_variants: ["stock"],
    orders: ["subtotal", "shipping_fee", "total", "commission"],
    order_items: ["price", "quantity"],
  };
  const nullableStringFields: Partial<Record<(typeof tableNames)[number], string[]>> = {
    products: ["category_id"],
    order_items: ["product_id", "variant_id"],
  };
  const tables = Object.fromEntries(
    tableNames.map((table) => [table, rowsFor(value, table)]),
  ) as Record<(typeof tableNames)[number], Record<string, unknown>[] | null>;
  const errors: string[] = [];

  for (const table of tableNames) {
    const rows = tables[table];
    if (!rows) {
      errors.push(`Table "${table}" is missing or is not an array of records.`);
    } else if (!hasUniqueIds(rows)) {
      errors.push(`Table "${table}" contains missing or duplicate IDs.`);
    } else {
      for (const [index, row] of rows.entries()) {
        for (const field of requiredStringFields[table]) {
          if (typeof row[field] !== "string") {
            errors.push(`Table "${table}" row ${index + 1} is missing string field "${field}".`);
          }
        }
        for (const field of requiredNumberFields[table] ?? []) {
          if (typeof row[field] !== "number" || !Number.isFinite(row[field])) {
            errors.push(`Table "${table}" row ${index + 1} is missing numeric field "${field}".`);
          }
        }
        for (const field of nullableStringFields[table] ?? []) {
          if (
            !Object.prototype.hasOwnProperty.call(row, field) ||
            (row[field] !== null && typeof row[field] !== "string")
          ) {
            errors.push(`Table "${table}" row ${index + 1} has invalid nullable field "${field}".`);
          }
        }
      }
    }
  }
  if (errors.length) return { valid: false, errors };

  const categories = tables["categories"]!;
  const products = tables["products"]!;
  const variants = tables["product_variants"]!;
  const orders = tables["orders"]!;
  const orderItems = tables["order_items"]!;
  const categoryIds = idSet(categories);
  const productIds = idSet(products);
  const variantIds = idSet(variants);
  const orderIds = idSet(orders);

  for (const product of products) {
    const categoryId = product["category_id"];
    if (categoryId !== null && categoryId !== undefined && !categoryIds.has(String(categoryId))) {
      errors.push(
        `Product "${String(product["id"])}" references a category that is not in this backup.`,
      );
    }
  }
  for (const variant of variants) {
    if (!productIds.has(String(variant["product_id"]))) {
      errors.push(
        `Variant "${String(variant["id"])}" references a product that is not in this backup.`,
      );
    }
  }
  for (const item of orderItems) {
    if (!orderIds.has(String(item["order_id"]))) {
      errors.push(
        `Order item "${String(item["id"])}" references an order that is not in this backup.`,
      );
    }
    const productId = item["product_id"];
    if (productId !== null && productId !== undefined && !productIds.has(String(productId))) {
      errors.push(
        `Order item "${String(item["id"])}" references a product that is not in this backup.`,
      );
    }
    const variantId = item["variant_id"];
    if (variantId !== null && variantId !== undefined && !variantIds.has(String(variantId))) {
      errors.push(
        `Order item "${String(item["id"])}" references a variant that is not in this backup.`,
      );
    }
  }

  if (errors.length) return { valid: false, errors };
  return {
    valid: true,
    counts: Object.fromEntries(tableNames.map((table) => [table, tables[table]!.length])),
  };
}

export function downloadDatabaseBackup(backup: DatabaseBackup, format: "json" | "sql") {
  const content = format === "json" ? JSON.stringify(backup, null, 2) : databaseBackupToSql(backup);
  const mimeType = format === "json" ? "application/json" : "application/sql";
  const file = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = `seaport-backup-${backup.generatedAt.slice(0, 10)}.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}
