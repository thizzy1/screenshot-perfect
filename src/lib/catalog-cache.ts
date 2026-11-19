import type { CatalogFilters } from "./queries";

const CACHE_PREFIX = "seaport-catalog-cache:";
const CACHE_TTL_MS = 60_000;

type CacheEntry<T> = {
  expiresAt: number;
  data: T;
};

export interface CatalogCacheAdapter {
  get<T>(key: string): Promise<CacheEntry<T> | undefined>;
  set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
  clear(prefix: string): Promise<void>;
}

export type CatalogCacheStatus = "CACHE MISS (Database Query)" | "CACHE HIT (Cached)";

export type CatalogFetchMetrics = {
  status: CatalogCacheStatus;
  responseTimeMs: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();
let externalAdapter: CatalogCacheAdapter | undefined;

export function configureCatalogCacheAdapter(adapter: CatalogCacheAdapter | undefined) {
  externalAdapter = adapter;
}

export function createUpstashRestCacheAdapter(url: string, token: string): CatalogCacheAdapter {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== "https:") {
    throw new Error("Upstash REST cache must use HTTPS.");
  }
  if (!token.trim()) throw new Error("Upstash REST cache token is required.");
  const endpoint = url.replace(/\/+$/, "");
  const runCommand = async (command: Array<string | number>) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });
    if (!response.ok) throw new Error(`Upstash REST request failed (${response.status}).`);
    const payload: unknown = await response.json();
    if (typeof payload !== "object" || payload === null || !("result" in payload)) {
      throw new Error("Upstash REST returned an invalid response.");
    }
    return payload.result;
  };

  return {
    async get<T>(key: string) {
      const result = await runCommand(["GET", key]);
      if (typeof result !== "string") return undefined;
      const parsed: unknown = JSON.parse(result);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("expiresAt" in parsed) ||
        typeof parsed.expiresAt !== "number" ||
        parsed.expiresAt <= Date.now() ||
        !("data" in parsed)
      ) {
        return undefined;
      }
      return { expiresAt: parsed.expiresAt, data: parsed.data as T };
    },
    async set<T>(key: string, entry: CacheEntry<T>) {
      const remainingTtlMs = Math.max(1, entry.expiresAt - Date.now());
      await runCommand(["SET", key, JSON.stringify(entry), "PX", remainingTtlMs]);
    },
    async clear(prefix: string) {
      let cursor = "0";
      do {
        const result = await runCommand(["SCAN", cursor, "MATCH", `${prefix}*`, "COUNT", 500]);
        if (!Array.isArray(result) || typeof result[0] !== "string" || !Array.isArray(result[1])) {
          throw new Error("Upstash REST returned an invalid scan response.");
        }
        cursor = result[0];
        const keys = result[1].filter((key): key is string => typeof key === "string");
        if (keys.length) await runCommand(["DEL", ...keys]);
      } while (cursor !== "0");
    },
  };
}

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function cacheKey(filters: CatalogFilters) {
  const sortedFilters = Object.fromEntries(
    Object.entries(filters).sort(([left], [right]) => left.localeCompare(right)),
  );
  return `${CACHE_PREFIX}${JSON.stringify(sortedFilters)}`;
}

function readLocalCache<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (!entry || typeof entry.expiresAt !== "number" || entry.expiresAt <= Date.now()) {
      window.localStorage.removeItem(key);
      return undefined;
    }
    return entry.data;
  } catch (error) {
    console.warn("Could not read the Seaport catalog cache from localStorage.", error);
    return undefined;
  }
}

function writeLocalCache<T>(key: string, entry: CacheEntry<T>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.warn("Could not write the Seaport catalog cache to localStorage.", error);
  }
}

export async function fetchCachedCatalog<T>(
  filters: CatalogFilters,
  fetchFromDatabase: () => Promise<T>,
): Promise<{ data: T; metrics: CatalogFetchMetrics }> {
  const key = cacheKey(filters);
  const startedAt = now();
  const inMemory = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (inMemory && inMemory.expiresAt > Date.now()) {
    return {
      data: inMemory.data,
      metrics: { status: "CACHE HIT (Cached)", responseTimeMs: Math.max(0, now() - startedAt) },
    };
  }
  memoryCache.delete(key);

  const local = readLocalCache<T>(key);
  if (local !== undefined) {
    memoryCache.set(key, { data: local, expiresAt: Date.now() + CACHE_TTL_MS });
    return {
      data: local,
      metrics: { status: "CACHE HIT (Cached)", responseTimeMs: Math.max(0, now() - startedAt) },
    };
  }

  if (externalAdapter) {
    try {
      const external = await externalAdapter.get<T>(key);
      if (external && external.expiresAt > Date.now()) {
        memoryCache.set(key, external);
        writeLocalCache(key, external);
        return {
          data: external.data,
          metrics: { status: "CACHE HIT (Cached)", responseTimeMs: Math.max(0, now() - startedAt) },
        };
      }
    } catch (error) {
      console.warn(
        "Could not read the external Seaport catalog cache; querying the database.",
        error,
      );
    }
  }

  const data = await fetchFromDatabase();
  const entry = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  memoryCache.set(key, entry);
  writeLocalCache(key, entry);
  if (externalAdapter) {
    try {
      await externalAdapter.set(key, entry);
    } catch (error) {
      console.warn("Could not write the external Seaport catalog cache.", error);
    }
  }
  return {
    data,
    metrics: {
      status: "CACHE MISS (Database Query)",
      responseTimeMs: Math.max(0, now() - startedAt),
    },
  };
}

export async function clearCatalogCache() {
  memoryCache.clear();
  if (typeof window !== "undefined") {
    try {
      for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
        const key = window.localStorage.key(index);
        if (key?.startsWith(CACHE_PREFIX)) window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn("Could not clear the Seaport catalog cache from localStorage.", error);
    }
  }
  if (externalAdapter) await externalAdapter.clear(CACHE_PREFIX);
}
