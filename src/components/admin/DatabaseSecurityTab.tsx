import { useState } from "react";
import {
  Database,
  Download,
  FileCheck2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { benchmarkCatalogCache } from "@/lib/queries";
import { clearCatalogCache } from "@/lib/catalog-cache";
import { clearServerCatalogCache } from "@/lib/catalog-cache.functions";
import {
  collectDatabaseBackup,
  downloadDatabaseBackup,
  validateDatabaseBackup,
  type BackupValidationResult,
} from "@/lib/database-backup";
import { errorMessage } from "@/lib/format";

export function DatabaseSecurityTab() {
  const [benchmark, setBenchmark] = useState<Awaited<ReturnType<typeof benchmarkCatalogCache>> | null>(null);
  const [benchmarkBusy, setBenchmarkBusy] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [restoreValidation, setRestoreValidation] = useState<BackupValidationResult | null>(null);

  async function runCatalogBenchmark() {
    setBenchmarkBusy(true);
    try {
      await clearServerCatalogCache();
      setBenchmark(await benchmarkCatalogCache({ sort: "new" }));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBenchmarkBusy(false);
    }
  }

  async function refreshCatalogCache() {
    try {
      await clearCatalogCache();
      await clearServerCatalogCache();
      setBenchmark(null);
      toast.success("Cache katalog dihapus; daftar produk siap dimuat ulang.");
    } catch (error) {
      toast.error(`Cache gagal dihapus: ${errorMessage(error)}`);
    }
  }

  async function exportDatabaseBackup(format: "json" | "sql") {
    setBackupBusy(true);
    try {
      const backup = await collectDatabaseBackup();
      downloadDatabaseBackup(backup, format);
      toast.success(`Backup ${format.toUpperCase()} berhasil diunduh.`);
    } catch (error) {
      toast.error(`Backup gagal: ${errorMessage(error)}`);
    } finally {
      setBackupBusy(false);
    }
  }

  async function validateRestoreBackup() {
    if (!backupFile) {
      toast.error("Pilih file backup JSON terlebih dahulu.");
      return;
    }

    try {
      const parsed: unknown = JSON.parse(await backupFile.text());
      const result = validateDatabaseBackup(parsed);
      setRestoreValidation(result);
      if (result.valid) {
        toast.success("Validasi dry-run berhasil. Tidak ada data live yang diubah.");
      } else {
        toast.error(`Backup tidak valid: ${result.errors[0] ?? "Struktur/integritas tidak cocok."}`);
      }
    } catch (error) {
      const result: BackupValidationResult = {
        valid: false,
        errors: [
          error instanceof Error
            ? `File JSON tidak dapat dibaca: ${error.message}`
            : "File JSON tidak dapat dibaca.",
        ],
      };
      setRestoreValidation(result);
      toast.error(result.errors[0] ?? "File JSON tidak dapat dibaca.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Timer className="h-5 w-5" /> Benchmark Cache Produk
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Uji Cache-Aside dengan cache in-memory dan LocalStorage TTL; adapter Redis/Upstash digunakan
          bila dikonfigurasi.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={runCatalogBenchmark} disabled={benchmarkBusy} className="gap-2">
            {benchmarkBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Timer className="h-4 w-4" />}
            Uji Fetch Produk
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={refreshCatalogCache}
            disabled={benchmarkBusy}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Clear Cache / Reset
          </Button>
        </div>
        {benchmark ? (
          <div className="mt-5 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Waktu Respons</th>
                  <th className="px-4 py-3">Detail</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-3 font-semibold">{benchmark.miss.status}</td>
                  <td className="px-4 py-3 tabular-nums">{benchmark.miss.responseTimeMs.toFixed(2)} ms</td>
                  <td className="px-4 py-3">{benchmark.productCount} produk</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3 font-semibold">{benchmark.hit.status}</td>
                  <td className="px-4 py-3 tabular-nums">{benchmark.hit.responseTimeMs.toFixed(2)} ms</td>
                  <td className="px-4 py-3">Data katalog tersimpan di cache</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-5 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Jalankan tes untuk membandingkan fetch MISS dari database dan fetch HIT dari cache.
          </p>
        )}
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <ShieldCheck className="h-5 w-5" /> Model ORM & Keamanan
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan skema Drizzle dari <code>src/db/schema.ts</code>; tidak menjalankan migrasi atau mengubah
          database.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="font-semibold">Product</p>
            <p className="mt-1 text-sm text-muted-foreground">
              products → categories dan product_variants; harga, gambar, spesifikasi, stok, serta status aktif.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-semibold">Order</p>
            <p className="mt-1 text-sm text-muted-foreground">
              orders → order_items → products / product_variants; status, total, pembayaran, dan pengiriman.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border p-4 text-sm">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Parameterized Query: <strong>Aktif</strong> melalui Supabase query builder / ORM binding.</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border p-4 text-sm">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Password Hashing: <strong>Ditangani Supabase Auth</strong>; hash tidak diekspor.</span>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Database className="h-5 w-5" /> Backup & Uji Restore (Dry-run)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ekspor tabel utama sesuai akses Admin. Uji restore hanya memeriksa format dan integritas; tidak menulis
          ke database live.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={() => exportDatabaseBackup("json")} disabled={backupBusy} className="gap-2">
            {backupBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download Backup (JSON)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => exportDatabaseBackup("sql")}
            disabled={backupBusy}
            className="gap-2"
          >
            {backupBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download Backup (SQL)
          </Button>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="admin-restore-backup">File backup JSON untuk divalidasi</Label>
            <Input
              id="admin-restore-backup"
              type="file"
              accept=".json,application/json"
              onChange={(event) => {
                setBackupFile(event.currentTarget.files?.[0] ?? null);
                setRestoreValidation(null);
              }}
            />
          </div>
          <Button type="button" variant="outline" onClick={validateRestoreBackup} className="gap-2">
            <FileCheck2 className="h-4 w-4" /> Uji Validasi Restore
          </Button>
        </div>
        {restoreValidation && (
          <div
            className={`mt-4 rounded-lg border p-4 text-sm ${
              restoreValidation.valid
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-destructive/30 bg-destructive/5"
            }`}
            role="status"
          >
            {restoreValidation.valid ? (
              <>
                <p className="font-semibold">Dry-run valid; data live tidak berubah.</p>
                <p className="mt-1 text-muted-foreground">
                  {Object.entries(restoreValidation.counts)
                    .map(([table, count]) => `${table}: ${count}`)
                    .join(" · ")}
                </p>
              </>
            ) : (
              <ul className="list-inside list-disc space-y-1">
                {restoreValidation.errors.slice(0, 5).map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

    </div>
  );
}
