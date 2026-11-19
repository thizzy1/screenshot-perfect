import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Plus,
    Pencil,
    Trash2,
    Package,
    ShoppingBag,
    Wallet,
    Store,
    Star,
    Upload,
    Loader2,
    Truck,
    Sparkles,
    Layers,
    CheckCircle,
    X,
    Image as ImageIcon,
    Database,
    Download,
    FileCheck2,
    RefreshCw,
    ShieldCheck,
    Timer,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { Workspace } from '@/components/store/Workspace';
import { StatusBadge } from '@/components/store/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { formatIDR, errorMessage } from '@/lib/format';
import { allowedOrderStatuses } from '@/lib/commerce';
import { uploadProductImage } from '@/lib/upload';
import { productImageBlendClass, productImageFrameClass } from '@/lib/product-image';
import {
    kidsShoeSizes,
    adultShoeSizes,
    apparelSizes,
    oneSizeValue,
    sizeLabel,
    sizeModeForCategory,
    sortVariantSizes,
} from '@/lib/sizing';
import { useI18n } from '@/lib/i18n';
import { mergeCategories, getCategoryLabel, ensureCategoryInDb } from '@/lib/categories';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { benchmarkCatalogCache } from '@/lib/queries';
import { clearCatalogCache } from '@/lib/catalog-cache';
import { clearServerCatalogCache } from '@/lib/catalog-cache.functions';
import {
    collectDatabaseBackup,
    downloadDatabaseBackup,
    validateDatabaseBackup,
    type BackupValidationResult,
} from '@/lib/database-backup';

export const Route = createFileRoute('/_authenticated/seller')({
    head: () => ({
        meta: [
            { title: 'Store Management | Seaport Official' },
            { name: 'description', content: 'Manage Seaport Official store products, inventory, and orders.' },
            { property: 'og:title', content: 'Store Management | Seaport Official' },
            { property: 'og:description', content: 'Seaport Official store operations.' },
            { property: 'og:type', content: 'website' },
            { name: 'twitter:card', content: 'summary' },
        ],
    }),
    component: Seller,
});

type Product = Tables<'products'> & { variants: Tables<'product_variants'>[] };

interface VariantItem {
    size: string;
    stock: number;
}

function Seller() {
    const { lang, t } = useI18n();
    const { user, hasRole, loading: authLoading, refreshRoles } = useAuth();
    const navigate = useNavigate();
    const qc = useQueryClient();

    // Admin access guard: redirect non-admin accounts to home
    useEffect(() => {
        if (!authLoading && !hasRole('admin')) {
            toast.error('Akses khusus Admin Toko Resmi');
            navigate({ to: '/', replace: true });
        }
    }, [authLoading, hasRole, navigate]);

    const [busy, setBusy] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [editor, setEditor] = useState(false);
    const [active, setActive] = useState(true);

    // Gallery Multi-POV images
    const [productImages, setProductImages] = useState<string[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    // Optional Banner Cutout PNG
    const [bannerImage, setBannerImage] = useState<string>('');
    const [uploadingBanner, setUploadingBanner] = useState(false);

    // Variants and inventory state
    const [variantsList, setVariantsList] = useState<VariantItem[]>([]);
    const [customSize, setCustomSize] = useState<string>('');
    const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('');
    const [sizeMode, setSizeMode] = useState<'footwear' | 'apparel' | 'one-size'>('footwear');
    const [specEntries, setSpecEntries] = useState<Array<{ key: string; value: string }>>([]);

    // Order tracking / resi dialog state
    const [shippingOrder, setShippingOrder] = useState<Tables<'orders'> | null>(null);
    const [resiInput, setResiInput] = useState<string>('');
    const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
    const [benchmark, setBenchmark] = useState<Awaited<ReturnType<typeof benchmarkCatalogCache>> | null>(null);
    const [benchmarkBusy, setBenchmarkBusy] = useState(false);
    const [backupBusy, setBackupBusy] = useState(false);
    const [backupFile, setBackupFile] = useState<File | null>(null);
    const [restoreValidation, setRestoreValidation] = useState<BackupValidationResult | null>(null);

    const { data: store, isPending, error } = useQuery({
        queryKey: ['own-store', user?.id],
        enabled: !!user,
        queryFn: async () => {
            if (!user) return null;
            const { data: ownStore } = await supabase
                .from('stores')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at')
                .limit(1)
                .maybeSingle();
            if (ownStore) return ownStore;
            const { data: anyStore } = await supabase
                .from('stores')
                .select('*')
                .order('created_at')
                .limit(1)
                .maybeSingle();
            return anyStore;
        },
    });

    const { data: products } = useQuery({
        queryKey: ['seller-products', store?.id],
        enabled: !!store,
        queryFn: async () => {
            if (!store) return [];
            const { data, error } = await supabase
                .from('products')
                .select('*,variants:product_variants(*)')
                .eq('store_id', store.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
    });

    const { data: orders } = useQuery({
        queryKey: ['seller-orders', store?.id],
        enabled: !!store,
        queryFn: async () => {
            if (!store) return [];
            const { data, error } = await supabase
                .from('orders')
                .select('*,items:order_items(*)')
                .eq('store_id', store.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data, error } = await supabase.from('categories').select('*');
            if (error) throw error;
            return data;
        },
    });
    const visibleCategories = mergeCategories(categories);

    function upsertSpecEntries(entries: Array<{ key: string; value: string }>) {
        setSpecEntries(entries.filter((entry) => entry.key.trim() && entry.value.trim()));
    }

    async function perform(fn: () => Promise<void>) {
        setBusy(true);
        try {
            await fn();
            await clearCatalogCache();
            await clearServerCatalogCache();
            await qc.invalidateQueries();
            toast.success('Perubahan berhasil disimpan');
        } catch (e) {
            toast.error(errorMessage(e));
        } finally {
            setBusy(false);
        }
    }

    async function runCatalogBenchmark() {
        setBenchmarkBusy(true);
        try {
            await clearServerCatalogCache();
            const result = await benchmarkCatalogCache({ sort: 'new' });
            setBenchmark(result);
        } catch (e) {
            toast.error(errorMessage(e));
        }
        finally {
            setBenchmarkBusy(false);
        }
    }

    async function refreshCatalogCache() {
        await clearCatalogCache();
        await clearServerCatalogCache();
        await qc.invalidateQueries({ queryKey: ['catalog'] });
        setBenchmark(null);
        toast.success('Cache katalog dihapus; daftar produk siap dimuat ulang.');
    }

    async function exportDatabaseBackup(format: 'json' | 'sql') {
        setBackupBusy(true);
        try {
            const backup = await collectDatabaseBackup();
            downloadDatabaseBackup(backup, format);
            toast.success(`Backup ${format.toUpperCase()} berhasil diunduh.`);
        } catch (e) {
            toast.error(`Backup gagal: ${errorMessage(e)}`);
        } finally {
            setBackupBusy(false);
        }
    }

    async function validateRestoreBackup() {
        if (!backupFile) {
            toast.error('Pilih file backup JSON terlebih dahulu.');
            return;
        }
        try {
            const parsed: unknown = JSON.parse(await backupFile.text());
            const result = validateDatabaseBackup(parsed);
            setRestoreValidation(result);
            if (result.valid) {
                toast.success('Validasi dry-run berhasil. Tidak ada data live yang diubah.');
            } else {
                toast.error(`Backup tidak valid: ${result.errors[0] ?? 'Struktur/integritas tidak cocok.'}`);
            }
        } catch (e) {
            const result: BackupValidationResult = {
                valid: false,
                errors: [e instanceof Error ? `File JSON tidak dapat dibaca: ${e.message}` : 'File JSON tidak dapat dibaca.'],
            };
            setRestoreValidation(result);
            toast.error(result.errors[0] ?? 'File JSON tidak dapat dibaca.');
        }
    }

    // Multi-POV upload handler
    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files || !files.length || !user) return;
        setUploadingImages(true);
        try {
            const urls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file) continue;
                const url = await uploadProductImage(file, user.id);
                urls.push(url);
            }
            setProductImages((prev) => [...prev, ...urls]);
            toast.success(`${urls.length} foto POV berhasil diunggah`);
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            setUploadingImages(false);
            e.target.value = '';
        }
    }

    // Banner Cutout PNG upload handler
    async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setUploadingBanner(true);
        try {
            const url = await uploadProductImage(file, user.id);
            setBannerImage(url);
            toast.success('Foto Banner Cutout PNG berhasil diunggah');
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            setUploadingBanner(false);
            e.target.value = '';
        }
    }

    function removeProductImage(index: number) {
        setProductImages((prev) => prev.filter((_, i) => i !== index));
    }

    function setCoverImage(index: number) {
        setProductImages((prev) => {
            if (index <= 0 || index >= prev.length) return prev;
            const target = prev[index];
            if (target === undefined) return prev;
            const rest = prev.filter((_, i) => i !== index);
            return [target, ...rest];
        });
    }

    // Variant helpers
    function applyPreset(group: 'kids' | 'adult' | 'apparel') {
        const activeSizeMode = sizeModeForCategory(selectedCategorySlug, sizeMode);
        if (activeSizeMode === 'one-size') {
            const existingOneSize = variantsList.find((variant) => variant.size === oneSizeValue);
            const fallbackStock = editing
                    ? variantsList.reduce((total, variant) => total + (Number(variant.stock) || 0), 0)
                    : 10;
            setVariantsList([{ size: oneSizeValue, stock: existingOneSize?.stock ?? fallbackStock }]);
            return;
        }
        const targetSizes = activeSizeMode === 'apparel'
            ? apparelSizes
            : group === 'kids'
                ? kidsShoeSizes
                : adultShoeSizes;
        const next = targetSizes.map((size) => {
            const found = variantsList.find((v) => v.size === size);
            return { size, stock: found ? found.stock : 0 };
        });
        setVariantsList(sortVariantSizes(next));
        const presetLabel = activeSizeMode === 'apparel'
            ? 'Apparel (XS–XXL)'
            : group === 'kids'
                ? 'Kids Shoes (EU 29–37)'
                : 'Adult Shoes (EU 39–45)';
        toast.info(`Preset ${presetLabel} diterapkan`);
    }

    function setOneSizeMode() {
        setSizeMode('one-size');
        setVariantsList((current) => {
            const existingOneSize = current.find((variant) => variant.size === oneSizeValue);
            const fallbackStock = editing
                ? current.reduce((total, variant) => total + (Number(variant.stock) || 0), 0)
                : 0;
            return [{ size: oneSizeValue, stock: existingOneSize?.stock ?? fallbackStock }];
        });
    }

    function addCustomSize() {
        const trimmed = customSize.trim();
        if (!trimmed) return;
        if (variantsList.some((v) => v.size.toLowerCase() === trimmed.toLowerCase())) {
            toast.error(`Ukuran "${trimmed}" sudah ada di daftar varian`);
            return;
        }
        const next = sortVariantSizes([...variantsList, { size: trimmed, stock: 0 }]);
        setVariantsList(next);
        setCustomSize('');
        toast.success(`Ukuran ${trimmed} berhasil ditambahkan`);
    }

    function updateVariantStock(size: string, stock: number) {
        setVariantsList((prev) =>
            prev.map((v) => (v.size === size ? { ...v, stock: Math.max(0, stock) } : v))
        );
    }

    function removeVariant(size: string) {
        setVariantsList((prev) => prev.filter((v) => v.size !== size));
    }

    function openProductEditor(product?: Product | null) {
        if (product) {
            setEditing(product);
            setActive(product.is_active);
            setProductImages(Array.isArray(product.images) ? [...product.images] : []);
            const specsObj =
                product.specs && typeof product.specs === 'object'
                    ? (product.specs as Record<string, any>)
                    : {};
            setBannerImage(typeof specsObj['banner_image'] === 'string' ? specsObj['banner_image'] : '');
            const existingVars = product.variants.map((v) => ({ size: v.size, stock: v.stock }));
            const entries = Object.entries(specsObj)
                .filter(([key]) => !['banner_image', 'size_mode'].includes(key))
                .map(([key, value]) => ({ key, value: typeof value === 'string' ? value : JSON.stringify(value) }));
            setSpecEntries(entries.length ? entries : [{ key: 'Material', value: '' }]);
            const resolvedCategory = product.category_id ?? '';
            const categoryData = visibleCategories.find((c) => c.id === resolvedCategory || c.slug === resolvedCategory);
            setSelectedCategorySlug(categoryData?.slug ?? '');
            const resolvedSizeMode = sizeModeForCategory(
                categoryData?.slug,
                typeof specsObj['size_mode'] === 'string'
                    ? specsObj['size_mode']
                    : existingVars.some((variant) => variant.size === oneSizeValue)
                        ? 'one-size'
                        : null
            );
            setSizeMode(resolvedSizeMode);
            if (resolvedSizeMode === 'one-size') {
                const oneSizeVariant = existingVars.find((variant) => variant.size === oneSizeValue);
                const stock = oneSizeVariant?.stock ?? existingVars.reduce((total, variant) => total + variant.stock, 0);
                setVariantsList([{ size: oneSizeValue, stock }]);
            } else {
                setVariantsList(sortVariantSizes(existingVars));
            }
        } else {
            setEditing(null);
            setActive(true);
            setProductImages([]);
            setBannerImage('');
            setSpecEntries([{ key: 'Material', value: '' }]);
            setSelectedCategorySlug('');
            setSizeMode('footwear');
            setVariantsList(adultShoeSizes.map((s) => ({ size: s, stock: 0 })));
        }
        setCustomSize('');
        setEditor(true);
    }

    async function saveProduct(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        if (!store || !user) return;

        const rawCategoryId = String(f.get('category')) || null;
        const selectedCat = visibleCategories.find((c) => c.id === rawCategoryId || c.slug === rawCategoryId);
        const categorySlug = selectedCat?.slug ?? '';
        const sizeMetadata = sizeModeForCategory(categorySlug, sizeMode);
        if (sizeMetadata !== 'one-size' && variantsList.some((variant) => variant.size === oneSizeValue)) {
            toast.error('Terapkan preset ukuran sesuai kategori sebelum menyimpan produk.');
            return;
        }

        if (!productImages.length) {
            toast.error('Tambahkan minimal 1 foto produk (disarankan 3+ sudut foto POV)');
            return;
        }

        if (!variantsList.length) {
            toast.error('Tambahkan minimal 1 varian ukuran produk dan stok');
            return;
        }

        await perform(async () => {
            const name = String(f.get('name')).trim();
            let realCategoryId: string | null = null;
            if (rawCategoryId) {
                realCategoryId = await ensureCategoryInDb(categorySlug || rawCategoryId, selectedCat?.name);
            }
            const existingSpecs =
                editing?.specs && typeof editing.specs === 'object'
                    ? (editing.specs as Record<string, any>)
                    : {};
            const specMap = Object.fromEntries(
                specEntries
                    .filter((entry) => entry.key.trim() && entry.value.trim())
                    .map((entry) => [entry.key.trim(), entry.value.trim()])
            );
            const specs = {
                ...existingSpecs,
                ...specMap,
                banner_image: bannerImage.trim() || null,
                size_mode: sizeMetadata,
            };

            const row = {
                name,
                description: String(f.get('description')),
                price: Number(f.get('price')),
                category_id: realCategoryId,
                gender: String(f.get('gender')),
                collection: String(f.get('collection')) || null,
                images: productImages,
                is_active: active,
                specs,
            };

            let id = editing?.id;
            if (id) {
                const { error } = await supabase.from('products').update(row).eq('id', id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('products')
                    .insert({
                        ...row,
                        store_id: store.id,
                        slug:
                            name.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
                            '-' +
                            crypto.randomUUID().slice(0, 6),
                    })
                    .select('id')
                    .single();
                if (error) throw error;
                id = data.id;
            }

            // Upsert variants
            const variantsToSave = variantsList.map((v) => ({
                product_id: id,
                size: v.size.trim(),
                stock: Number(v.stock) || 0,
            }));

            // Delete variants that were removed by admin (orphan cleanup)
            if (editing && id) {
                const sizesToKeep = variantsToSave.map((v) => v.size);
                if (sizesToKeep.length > 0) {
                    // Build a comma-separated list for the .not('size','in','(...)') filter
                    const keepList = `(${sizesToKeep.map((s) => `"${s}"`).join(',')})`;
                    const { error: delError } = await supabase
                        .from('product_variants')
                        .delete()
                        .eq('product_id', id)
                        .not('size', 'in', keepList);
                    if (delError) throw delError;
                } else {
                    // All variants removed — delete everything
                    const { error: delError } = await supabase
                        .from('product_variants')
                        .delete()
                        .eq('product_id', id);
                    if (delError) throw delError;
                }
            }

            const { error: varError } = await supabase
                .from('product_variants')
                .upsert(variantsToSave, { onConflict: 'product_id,size' });
            if (varError) throw varError;

            setEditor(false);
        });
    }

    // Handle courier tracking input when shipping an order
    function startShippingOrder(order: Tables<'orders'>) {
        setShippingOrder(order);
        const existingResi =
            localStorage.getItem(`seaport_resi_${order.id}`) ||
            (order.courier.includes('Resi:') ? (order.courier.split('Resi:')[1] ?? '').trim() : '');
        setResiInput(existingResi);
        setShippingDialogOpen(true);
    }

    async function confirmShipping() {
        if (!shippingOrder) return;
        const resi = resiInput.trim();
        if (!resi) {
            toast.error('Masukkan nomor resi kurir pengiriman');
            return;
        }

        await perform(async () => {
            // Best-effort update courier string with resi
            try {
                await supabase
                    .from('orders')
                    .update({
                        courier: `${(shippingOrder.courier.split('·')[0] ?? shippingOrder.courier).trim()} · Resi: ${resi}`,
                    })
                    .eq('id', shippingOrder.id);
            } catch {
                // Ignored if direct update is restricted by RLS
            }

            try {
                localStorage.setItem(`seaport_resi_${shippingOrder.id}`, resi);
            } catch { }

            const { error } = await supabase.rpc('update_order_status', {
                _order: shippingOrder.id,
                _status: 'shipped',
            });
            if (error) throw error;

            setShippingDialogOpen(false);
            setResiInput('');
            setShippingOrder(null);
            toast.success(`Pesanan #${shippingOrder.order_number} dikirim dengan resi ${resi}`);
        });
    }

    if (authLoading || (!authLoading && !hasRole('admin'))) {
        return (
            <Workspace title="Store Management" admin>
                <div className="flex items-center gap-3 py-16 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Memverifikasi hak akses admin Seaport Official...</span>
                </div>
            </Workspace>
        );
    }

    if (isPending) {
        return <Workspace title="Store Management">Memuat data toko Seaport Official…</Workspace>;
    }

    if (error) {
        return (
            <Workspace title="Store Management">
                <p className="text-destructive">{errorMessage(error)}</p>
            </Workspace>
        );
    }

    if (!store) {
        return (
            <Workspace title="Inisialisasi Toko Resmi Seaport">
                <form
                    className="max-w-lg space-y-5 rounded-xl border bg-card p-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        perform(async () => {
                            const { error } = await supabase.rpc('become_seller', {
                                _name: String(f.get('name')),
                                _description: String(f.get('description')),
                            });
                            if (error) throw error;
                            await refreshRoles();
                        });
                    }}
                >
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold">Inisialisasi Toko Resmi</h2>
                        <p className="text-sm text-muted-foreground">
                            Konfigurasi toko retail tunggal Seaport Official untuk mulai mengelola katalog dan pesanan.
                        </p>
                    </div>
                    <div>
                        <Label htmlFor="store-name">Nama Toko Resmi</Label>
                        <Input id="store-name" name="name" defaultValue="Seaport Official Store" required minLength={2} />
                    </div>
                    <div>
                        <Label htmlFor="store-description">Deskripsi Toko</Label>
                        <textarea
                            id="store-description"
                            name="description"
                            defaultValue="Official Store Seaport Sportswear & Basketball Shoes Indonesia. 100% Original Guaranteed."
                            className="min-h-24 w-full rounded-md border bg-background p-3"
                        />
                    </div>
                    <Button disabled={busy}>Inisialisasi Toko Resmi</Button>
                </form>
            </Workspace>
        );
    }

    const editorSizeMode = sizeModeForCategory(selectedCategorySlug, sizeMode);
    const settled = (orders ?? []).filter((o) =>
        ['paid', 'processing', 'shipped', 'completed'].includes(o.status)
    );
    const revenue = settled.reduce((s, o) => s + o.subtotal - o.commission, 0);
    const chart = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 6 + i);
        const key = date.toISOString().slice(0, 10);
        return {
            day: date.toLocaleDateString('en', { weekday: 'short' }),
            sales: settled
                .filter((o) => o.created_at.startsWith(key))
                .reduce((s, o) => s + o.subtotal, 0),
        };
    });

    return (
        <Workspace title="Store Management">
            <div className="mb-8 flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="gap-1.5 px-3 py-1 font-bold text-sm bg-primary/10 text-primary border-primary/20">
                    <Sparkles className="h-3.5 w-3.5" /> SEAPORT OFFICIAL RETAIL STORE
                </Badge>
                <StatusBadge status={store.status} />
            </div>

            <div className="mb-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
                {[
                    {
                        label: 'Total Penjualan',
                        value: formatIDR(settled.reduce((s, o) => s + o.subtotal, 0)),
                        icon: ShoppingBag,
                    },
                    { label: 'Pendapatan Bersih', value: formatIDR(revenue), icon: Wallet },
                    {
                        label: 'Produk Aktif',
                        value: products?.filter((p) => p.is_active).length ?? 0,
                        icon: Package,
                    },
                    {
                        label: 'Pesanan Diproses',
                        value: orders?.filter((o) => ['paid', 'processing', 'shipped'].includes(o.status)).length ?? 0,
                        icon: Store,
                    },
                ].map((s) => (
                    <div key={s.label} className="rounded-xl border bg-card p-5 shadow-sm">
                        <s.icon className="mb-3 h-5 w-5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{s.label}</p>
                        <p className="mt-1 break-words text-2xl font-bold">{s.value}</p>
                    </div>
                ))}
            </div>

            <Tabs defaultValue="products">
                <TabsList className="mb-6 h-auto max-w-full flex-wrap justify-start">
                    <TabsTrigger value="products">Produk & Stok</TabsTrigger>
                    <TabsTrigger value="orders">Pesanan Masuk</TabsTrigger>
                    <TabsTrigger value="overview">Laporan Penjualan</TabsTrigger>
                    <TabsTrigger value="store">Profil Toko Resmi</TabsTrigger>
                    <TabsTrigger value="database">Basis Data & Cache</TabsTrigger>
                </TabsList>

                {/* PRODUCTS TAB */}
                <TabsContent value="products">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-2xl font-bold">Katalog Produk Resmi</h2>
                            <p className="text-sm text-muted-foreground">
                                Kelola produk, varian ukuran (Anak EU 29–37, Dewasa EU 39–45, Apparel XS–XXL), dan foto banner cutout.
                            </p>
                        </div>
                        <Button onClick={() => openProductEditor(null)} className="gap-2">
                            <Plus className="h-4 w-4" /> Tambah Produk
                        </Button>
                    </div>

                    {!products?.length && (
                        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                            <Package className="mx-auto mb-3 h-10 w-10 opacity-40" />
                            <p className="font-medium">Belum ada produk resmi di katalog.</p>
                            <Button onClick={() => openProductEditor(null)} variant="outline" className="mt-4">
                                Tambah Produk Pertama
                            </Button>
                        </div>
                    )}

                    <div className="divide-y">
                        {products?.map((p) => {
                            const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
                            const specs = (p.specs && typeof p.specs === 'object' ? p.specs : {}) as Record<string, any>;
                            const hasBannerCutout = !!specs['banner_image'];

                            return (
                                <div key={p.id} className="flex flex-wrap items-center gap-4 py-4">
                                    {p.images[0] && (
                                        <div className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg ${productImageFrameClass}`}>
                                            <img
                                                src={p.images[0]}
                                                alt={p.name}
                                                className={`h-full w-full rounded-lg object-contain p-1 ${productImageBlendClass(p.images[0])}`}
                                            />
                                            {p.images.length > 1 && (
                                                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-bold text-white">
                                                    {p.images.length} POV
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-bold text-base">{p.name}</p>
                                            {hasBannerCutout && (
                                                <Badge variant="secondary" className="text-[10px] gap-1 font-semibold">
                                                    <ImageIcon className="h-3 w-3" /> Cutout Banner
                                                </Badge>
                                            )}
                                            <Badge variant={p.is_active ? 'default' : 'outline'} className="text-[10px]">
                                                {p.is_active ? 'Aktif' : 'Tersembunyi'}
                                            </Badge>
                                        </div>

                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {formatIDR(p.price)} · Total Stok: {totalStock} unit
                                        </p>

                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {sortVariantSizes(p.variants).map((v) => (
                                                <span
                                                    key={v.id}
                                                    className={`rounded px-1.5 py-0.5 text-xs font-mono border ${v.stock > 0
                                                        ? 'bg-muted text-foreground'
                                                        : 'bg-destructive/10 text-destructive border-destructive/20'
                                                        }`}
                                                >
                                                    {sizeLabel(v.size)}: <span className="font-semibold">{v.stock}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1.5"
                                            aria-label={`Edit ${p.name}`}
                                            onClick={() => openProductEditor(p)}
                                        >
                                            <Pencil className="h-3.5 w-3.5" /> Edit
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="text-destructive hover:bg-destructive/10"
                                            aria-label={`Delete ${p.name}`}
                                            disabled={busy}
                                            onClick={() => {
                                                if (window.confirm(`Hapus produk "${p.name}"?`)) {
                                                    perform(async () => {
                                                        const { error } = await supabase.from('products').delete().eq('id', p.id);
                                                        if (error) throw error;
                                                    });
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </TabsContent>

                {/* ORDERS TAB */}
                <TabsContent value="orders">
                    <div className="mb-5">
                        <h2 className="text-2xl font-bold">Pesanan Masuk</h2>
                        <p className="text-sm text-muted-foreground">
                            Kelola status pengiriman (Paid → Processing → Shipped + No. Resi Kurir → Delivered).
                        </p>
                    </div>

                    {!orders?.length && (
                        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                            <ShoppingBag className="mx-auto mb-3 h-10 w-10 opacity-40" />
                            <p className="font-medium">Belum ada pesanan masuk.</p>
                        </div>
                    )}

                    <div className="divide-y">
                        {orders?.map((o) => {
                            const resiNumber =
                                localStorage.getItem(`seaport_resi_${o.id}`) ||
                                (o.courier.includes('Resi:') ? (o.courier.split('Resi:')[1] ?? '').trim() : '');

                            return (
                                <div key={o.id} className="space-y-3 py-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-bold text-base">
                                                #{o.order_number} · {formatIDR(o.total)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(o.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={o.status} />
                                            {resiNumber && (
                                                <Badge variant="secondary" className="gap-1 font-mono text-xs">
                                                    <Truck className="h-3 w-3" /> Resi: {resiNumber}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-muted/40 p-3 text-sm">
                                        <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                            Item Pesanan
                                        </p>
                                        <p className="text-foreground">
                                            {o.items.map((i) => `${i.name} (${sizeLabel(i.size)}) × ${i.quantity}`).join(', ')}
                                        </p>
                                    </div>

                                    <div className="text-sm text-muted-foreground">
                                        <p className="font-semibold text-foreground">
                                            Penerima: {o.shipping_name} ({o.shipping_phone})
                                        </p>
                                        <p>
                                            {o.shipping_address}, {o.shipping_city} {o.shipping_postal}
                                        </p>
                                        <p className="text-xs mt-1">
                                            Layanan Pengiriman:{' '}
                                            <span className="font-medium text-foreground">{o.courier}</span>
                                        </p>
                                    </div>

                                    {/* Order status transition buttons */}
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        {allowedOrderStatuses(o.status).map((status) => {
                                            if (status === 'shipped') {
                                                return (
                                                    <Button
                                                        key={status}
                                                        size="sm"
                                                        disabled={busy}
                                                        onClick={() => startShippingOrder(o)}
                                                        className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                                                    >
                                                        <Truck className="h-3.5 w-3.5" /> Kirim Pesanan (Input Resi)
                                                    </Button>
                                                );
                                            }

                                            if (status === 'completed') {
                                                return (
                                                    <Button
                                                        key={status}
                                                        size="sm"
                                                        disabled={busy}
                                                        onClick={() =>
                                                            perform(async () => {
                                                                const { error } = await supabase.rpc('update_order_status', {
                                                                    _order: o.id,
                                                                    _status: 'completed',
                                                                });
                                                                if (error) throw error;
                                                            })
                                                        }
                                                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5" /> Tandai Terkirim (Delivered)
                                                    </Button>
                                                );
                                            }

                                            return (
                                                <Button
                                                    key={status}
                                                    size="sm"
                                                    variant={status === 'cancelled' ? 'outline' : 'default'}
                                                    disabled={busy}
                                                    onClick={() =>
                                                        perform(async () => {
                                                            const { error } = await supabase.rpc('update_order_status', {
                                                                _order: o.id,
                                                                _status: status,
                                                            });
                                                            if (error) throw error;
                                                        })
                                                    }
                                                    className="capitalize"
                                                >
                                                    Ubah ke {status}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </TabsContent>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview">
                    <h2 className="mb-5 text-2xl font-bold">Penjualan · 7 Hari Terakhir</h2>
                    <div className="h-72 w-full rounded-xl border bg-card p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chart}>
                                <XAxis dataKey="day" />
                                <Tooltip formatter={(v) => formatIDR(Number(v))} />
                                <Bar dataKey="sales" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </TabsContent>

                <TabsContent value="database">
                    <div className="space-y-6">
                        <section className="rounded-xl border bg-card p-5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h2 className="flex items-center gap-2 text-2xl font-bold">
                                        <Timer className="h-5 w-5" /> Live Benchmark Cache Produk
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Tes katalog yang sama dua kali: permintaan pertama dari database, lalu permintaan berikutnya dari cache TTL.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button type="button" variant="outline" onClick={refreshCatalogCache} className="gap-2">
                                        <RefreshCw className="h-4 w-4" /> Hapus Cache / Refresh
                                    </Button>
                                    <Button type="button" onClick={runCatalogBenchmark} disabled={benchmarkBusy} className="gap-2">
                                        {benchmarkBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Timer className="h-4 w-4" />}
                                        Tes Ulang MISS / HIT
                                    </Button>
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">
                                Cache browser: in-memory + LocalStorage TTL 60 detik. Adapter Upstash REST opsional memakai konfigurasi server (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN); kredensial tidak dikirim ke browser.
                            </p>
                            {benchmark ? (
                                <div className="mt-5 overflow-x-auto">
                                    <table className="w-full min-w-[32rem] text-left text-sm">
                                        <thead>
                                            <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                                                <th className="py-2 pr-4">Status</th>
                                                <th className="py-2 pr-4">Waktu respons</th>
                                                <th className="py-2">Hasil</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b">
                                                <td className="py-3 pr-4 font-semibold">{benchmark.miss.status}</td>
                                                <td className="py-3 pr-4 tabular-nums">{benchmark.miss.responseTimeMs.toFixed(2)} ms</td>
                                                <td className="py-3">{benchmark.productCount} produk</td>
                                            </tr>
                                            <tr>
                                                <td className="py-3 pr-4 font-semibold">{benchmark.hit.status}</td>
                                                <td className="py-3 pr-4 tabular-nums">{benchmark.hit.responseTimeMs.toFixed(2)} ms</td>
                                                <td className="py-3">Data katalog tersimpan di cache</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="mt-5 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                    Jalankan tes untuk mencatat waktu MISS dan HIT dari permintaan aktual.
                                </p>
                            )}
                        </section>

                        <section className="rounded-xl border bg-card p-5">
                            <h2 className="flex items-center gap-2 text-2xl font-bold">
                                <ShieldCheck className="h-5 w-5" /> Preview Skema ORM & Keamanan
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Model Drizzle mencerminkan tabel PostgreSQL yang dipakai aplikasi; tidak menjalankan migrasi atau mengubah database.
                            </p>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                <div className="rounded-lg border p-4">
                                    <p className="font-semibold">Product</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        products → categories, product_variants; fields mencakup harga, gambar, spesifikasi, stok, dan status aktif.
                                    </p>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <p className="font-semibold">Order</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        orders → order_items → products / product_variants; mencakup total, status, pembayaran, dan pengiriman.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg border p-4 text-sm">
                                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                    Parameterized Query: <strong>Aktif</strong> (Supabase query builder / ORM binding)
                                </div>
                                <div className="flex items-center gap-2 rounded-lg border p-4 text-sm">
                                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                    Password Hashing bcrypt: <strong>Aktif melalui Supabase Auth</strong>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border bg-card p-5">
                            <h2 className="flex items-center gap-2 text-2xl font-bold">
                                <Database className="h-5 w-5" /> Backup & Uji Restore (Dry-run)
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Ekspor tabel utama sesuai akses Admin saat ini. Validasi backup hanya memeriksa format, ID unik, dan relasi; tidak menulis ke database.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button type="button" onClick={() => exportDatabaseBackup('json')} disabled={backupBusy} className="gap-2">
                                    {backupBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    Download Backup (JSON)
                                </Button>
                                <Button type="button" variant="outline" onClick={() => exportDatabaseBackup('sql')} disabled={backupBusy} className="gap-2">
                                    {backupBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    Download Backup (SQL)
                                </Button>
                            </div>
                            <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="restore-backup">File backup JSON untuk divalidasi</Label>
                                    <Input
                                        id="restore-backup"
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
                                            ? 'border-emerald-500/30 bg-emerald-500/5'
                                            : 'border-destructive/30 bg-destructive/5'
                                    }`}
                                    role="status"
                                >
                                    {restoreValidation.valid ? (
                                        <>
                                            <p className="font-semibold">Dry-run valid; data live tidak berubah.</p>
                                            <p className="mt-1 text-muted-foreground">
                                                {Object.entries(restoreValidation.counts)
                                                    .map(([table, count]) => `${table}: ${count}`)
                                                    .join(' · ')}
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
                </TabsContent>

                {/* STORE PROFILE TAB */}
                <TabsContent value="store">
                    <form
                        className="max-w-lg space-y-4 rounded-xl border bg-card p-6"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const f = new FormData(e.currentTarget);
                            perform(async () => {
                                let logo_url = store.logo_url;
                                const file = f.get('logo');
                                if (file instanceof File && file.size && user) {
                                    logo_url = await uploadProductImage(file, user.id);
                                }
                                const { error } = await supabase
                                    .from('stores')
                                    .update({
                                        name: String(f.get('name')),
                                        description: String(f.get('description')),
                                        logo_url,
                                    })
                                    .eq('id', store.id);
                                if (error) throw error;
                            });
                        }}
                    >
                        <h2 className="text-xl font-bold">Profil Toko Resmi</h2>
                        <div>
                            <Label htmlFor="edit-store-name">Nama Toko</Label>
                            <Input
                                id="edit-store-name"
                                name="name"
                                defaultValue={store.name}
                                required
                                minLength={2}
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Deskripsi</Label>
                            <textarea
                                id="description"
                                name="description"
                                defaultValue={store.description ?? ''}
                                className="min-h-24 w-full rounded-md border bg-background p-3"
                            />
                        </div>
                        <div>
                            <Label htmlFor="logo">Logo Toko</Label>
                            {store.logo_url && (
                                <div className="my-2">
                                    <img
                                        src={store.logo_url}
                                        alt="Store logo"
                                        className="h-16 w-auto object-contain rounded border p-1"
                                    />
                                </div>
                            )}
                            <Input id="logo" name="logo" type="file" accept="image/*" />
                        </div>
                        <Button disabled={busy}>Simpan Profil Toko</Button>
                    </form>
                </TabsContent>
            </Tabs>

            {/* DIALOG: PRODUCT EDITOR (WITH KIDS/ADULT/APPAREL PRESETS & BANNER CUTOUT) */}
            <Dialog open={editor} onOpenChange={setEditor}>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                    <DialogTitle>{editing ? 'Edit Produk Resmi' : 'Tambah Produk Baru'}</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Lengkapi detail produk, foto multi-POV, banner cutout opsional, dan varian stok ukuran.
                    </DialogDescription>

                    <form className="space-y-5 pt-2" onSubmit={saveProduct}>
                        <div>
                            <Label htmlFor="product-name">Nama Produk</Label>
                            <Input
                                id="product-name"
                                name="name"
                                placeholder="Contoh: Kyrie 8 Infinity Basketball Shoes"
                                defaultValue={editing?.name}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="price">Harga (IDR)</Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    min="0"
                                    step="1"
                                    placeholder="1899000"
                                    defaultValue={editing?.price}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="collection">Koleksi / Brand</Label>
                                <Input
                                    id="collection"
                                    name="collection"
                                    placeholder="Contoh: Kyrie / Anta / Seaport"
                                    defaultValue={editing?.collection ?? ''}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="category">{lang === 'id' ? 'Kategori' : 'Category'}</Label>
                                <select
                                    id="category"
                                    name="category"
                                    defaultValue={editing?.category_id ?? ''}
                                    onChange={(e) => {
                                        const selected = visibleCategories.find((c) => c.id === e.target.value || c.slug === e.target.value);
                                        const slug = selected?.slug ?? '';
                                        setSelectedCategorySlug(slug);
                                        const nextSizeMode = sizeModeForCategory(slug);
                                        setSizeMode(nextSizeMode);
                                        if (nextSizeMode === 'one-size') {
                                            setVariantsList((current) => {
                                                const existingOneSize = current.find((variant) => variant.size === oneSizeValue);
                                                const fallbackStock = editing
                                                    ? current.reduce((total, variant) => total + (Number(variant.stock) || 0), 0)
                                                    : 0;
                                                return [{ size: oneSizeValue, stock: existingOneSize?.stock ?? fallbackStock }];
                                            });
                                        } else if (nextSizeMode === 'footwear' && !editing) {
                                            setVariantsList(adultShoeSizes.map((s) => ({ size: s, stock: 0 })));
                                        } else if (nextSizeMode === 'apparel' && !editing) {
                                            setVariantsList(apparelSizes.map((s) => ({ size: s, stock: 0 })));
                                        }
                                    }}
                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                >
                                    <option value="">{lang === 'id' ? 'Pilih Kategori' : 'Select Category'}</option>
                                    {visibleCategories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {getCategoryLabel(c.slug, lang)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="gender">Gender</Label>
                                <select
                                    id="gender"
                                    name="gender"
                                    defaultValue={editing?.gender ?? 'unisex'}
                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm capitalize"
                                >
                                    {['unisex', 'men', 'women', 'kids'].map((g) => (
                                        <option key={g} value={g}>
                                            {g}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {['badminton', 'cycling'].includes(selectedCategorySlug) && (
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Sub-tipe ukuran</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Button type="button" variant={sizeMode === 'footwear' ? 'default' : 'outline'} size="sm" onClick={() => setSizeMode('footwear')}>Sepatu / Court</Button>
                                    <Button type="button" variant={sizeMode === 'apparel' ? 'default' : 'outline'} size="sm" onClick={() => setSizeMode('apparel')}>Pakaian</Button>
                                    <Button type="button" variant={sizeMode === 'one-size' ? 'default' : 'outline'} size="sm" onClick={setOneSizeMode}>Peralatan / One Size</Button>
                                </div>
                            </div>
                        )}

                        <div>
                            <Label htmlFor="product-description">Deskripsi Produk</Label>
                            <textarea
                                id="product-description"
                                name="description"
                                placeholder="Deskripsi performa sepatu, bantalan, dan keunggulan teknologi..."
                                defaultValue={editing?.description ?? ''}
                                className="min-h-20 w-full rounded-md border bg-background p-3 text-sm"
                            />
                        </div>

                        {/* 1. GALERI MULTI-POV FOTO */}
                        <div className="space-y-2 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="image-files" className="text-sm font-semibold">
                                    Galeri Multi-POV Foto ({productImages.length} foto)
                                </Label>
                                <span className="text-xs text-muted-foreground">Minimal 1, disarankan 3+ sudut foto POV</span>
                            </div>

                            <div className="rounded-xl border border-dashed border-input p-4 text-center hover:bg-muted/40 transition">
                                <Input
                                    id="image-files"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    disabled={uploadingImages || busy}
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="image-files"
                                    className="flex flex-col items-center justify-center cursor-pointer gap-1"
                                >
                                    {uploadingImages ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    ) : (
                                        <Upload className="h-6 w-6 text-muted-foreground" />
                                    )}
                                    <span className="text-sm font-semibold text-foreground">
                                        {uploadingImages ? 'Mengunggah foto...' : 'Pilih Foto Multi-POV (Upload)'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Pilih beberapa foto POV sekaligus (JPG, PNG, WEBP max 5MB)
                                    </span>
                                </label>
                            </div>

                            {productImages.length > 0 && (
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 pt-1">
                                    {productImages.map((url, idx) => (
                                        <div
                                            key={url + idx}
                                            className="group relative min-w-0 overflow-hidden rounded-xl border bg-card p-1.5 shadow-sm"
                                        >
                                            <div className={`relative aspect-square w-full overflow-hidden rounded-lg ${productImageFrameClass}`}>
                                                <img
                                                    src={url}
                                                    alt={`POV ${idx + 1}`}
                                                    className={`h-full w-full rounded-lg object-contain p-1 ${productImageBlendClass(url)}`}
                                                />
                                                <span className="absolute left-1.5 top-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                                    POV {idx + 1}
                                                </span>
                                                {idx === 0 && (
                                                    <Badge
                                                        variant="default"
                                                        className="absolute bottom-1.5 left-1.5 text-[9px] px-1 py-0 h-4 font-bold uppercase tracking-wider"
                                                    >
                                                        Foto Utama
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="mt-1.5 flex items-center justify-between gap-1">
                                                {idx !== 0 ? (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-6 px-1.5 text-[10px] gap-1 font-medium"
                                                        onClick={() => setCoverImage(idx)}
                                                        title="Jadikan Foto Utama"
                                                    >
                                                        <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                                                        <span>Utama</span>
                                                    </Button>
                                                ) : (
                                                    <span className="text-[10px] font-semibold text-muted-foreground px-1">
                                                        Sampul
                                                    </span>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 ml-auto"
                                                    onClick={() => removeProductImage(idx)}
                                                    title="Hapus foto ini"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. BANNER CUTOUT PNG (OPSIONAL) */}
                        <div className="space-y-2 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="banner-file" className="text-sm font-semibold flex items-center gap-1.5">
                                        <Sparkles className="h-4 w-4 text-primary" /> Banner Cutout PNG (Opsional)
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Foto produk PNG transparan murni untuk tampil melayang pada Hero & Spotlight Banner.
                                    </p>
                                </div>
                            </div>

                            {bannerImage ? (
                                <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                                    <div className="relative h-16 w-16 shrink-0 rounded-lg bg-black/5 p-1 border">
                                        <img
                                            src={bannerImage}
                                            alt="Banner Cutout"
                                            className="h-full w-full object-contain"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1 text-xs">
                                        <p className="font-semibold text-foreground truncate">Banner Cutout Terpasang</p>
                                        <p className="text-muted-foreground truncate">{bannerImage}</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => setBannerImage('')}
                                    >
                                        Hapus
                                    </Button>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-input p-3 text-center hover:bg-muted/40 transition">
                                    <Input
                                        id="banner-file"
                                        type="file"
                                        accept="image/png,image/webp"
                                        disabled={uploadingBanner || busy}
                                        onChange={handleBannerUpload}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="banner-file"
                                        className="flex items-center justify-center cursor-pointer gap-2 py-1 text-xs font-semibold"
                                    >
                                        {uploadingBanner ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        ) : (
                                            <Upload className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span>{uploadingBanner ? 'Mengunggah banner...' : 'Unggah File PNG Transparan'}</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* 3. VARIAN UKURAN & STOK (KIDS EU 29–37, ADULT EU 39–45, APPAREL XS–XXL) */}
                        <div className="min-w-0 space-y-3 border-t pt-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                                        <Layers className="h-4 w-4 text-primary" /> Varian Ukuran & Stok
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Pilih preset ukuran atau tambah ukuran kustom secara fleksibel.
                                    </p>
                                </div>
                                <Badge variant="outline" className="text-xs font-mono">
                                    {variantsList.reduce((acc, v) => acc + (Number(v.stock) || 0), 0)} unit total
                                </Badge>
                            </div>

                            {/* Preset Buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-muted-foreground">Preset:</span>
                                {editorSizeMode === 'footwear' && (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs gap-1"
                                            onClick={() => applyPreset('adult')}
                                        >
                                            👟 Adult Shoes (EU 39–45)
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs gap-1"
                                            onClick={() => applyPreset('kids')}
                                        >
                                            👟 Kids Shoes (EU 29–37)
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs gap-1"
                                            onClick={() => {
                                                const allSizes = [...kidsShoeSizes, ...adultShoeSizes];
                                                const next = allSizes.map((size) => {
                                                    const found = variantsList.find((v) => v.size === size);
                                                    return { size, stock: found ? found.stock : 0 };
                                                });
                                                setVariantsList(sortVariantSizes(next));
                                                toast.info('Preset Adult + Kids (EU 29–45) diterapkan');
                                            }}
                                        >
                                            👟 Adult + Kids (EU 29–45)
                                        </Button>
                                    </>
                                )}
                                {editorSizeMode === 'apparel' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1"
                                        onClick={() => applyPreset('apparel')}
                                    >
                                        👕 Apparel (XS–XXL)
                                    </Button>
                                )}
                                {editorSizeMode === 'one-size' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1"
                                        onClick={() => {
                                            setVariantsList([{ size: oneSizeValue, stock: 0 }]);
                                            toast.info('Preset One Size diterapkan');
                                        }}
                                    >
                                        📦 One Size
                                    </Button>
                                )}
                            </div>

                            {/* Custom Size Adder */}
                            <div className="flex min-w-0 items-center gap-2">
                                <Input
                                    placeholder="Ukuran kustom (misal: 38, 46, All Size)"
                                    value={customSize}
                                    onChange={(e) => setCustomSize(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addCustomSize();
                                        }
                                    }}
                                    className="h-8 text-xs"
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 shrink-0 text-xs gap-1"
                                    onClick={addCustomSize}
                                >
                                    <Plus className="h-3.5 w-3.5" /> + Add Custom Size
                                </Button>
                            </div>

                            {/* Variants Grid List */}
                            <div className="max-h-56 overflow-y-auto rounded-lg border bg-muted/20 p-2.5">
                                {!variantsList.length ? (
                                    <p className="py-4 text-center text-xs text-muted-foreground">
                                        Belum ada varian ukuran. Klik preset di atas atau tambah ukuran kustom.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        {variantsList.map((v) => (
                                            <div
                                                key={v.size}
                                                className="flex items-center justify-between gap-1.5 rounded-md border bg-card p-1.5 shadow-xs"
                                            >
                                                <span className="font-mono text-xs font-bold text-foreground w-14 shrink-0 pl-1">
                                                    {sizeLabel(v.size)}
                                                </span>
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <span className="text-[10px] text-muted-foreground">Stok:</span>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={v.stock}
                                                        onChange={(e) => updateVariantStock(v.size, Number(e.target.value))}
                                                        className="h-7 w-16 px-1 text-center font-mono text-xs"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                    onClick={() => removeVariant(v.size)}
                                                    title={`Hapus ukuran ${v.size}`}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4. SPECIFICATIONS KEY-VALUE (DINAMIS) */}
                        <div className="space-y-3 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Spesifikasi Produk</Label>
                                <Button type="button" variant="outline" size="sm" onClick={() => setSpecEntries((prev) => [...prev, { key: '', value: '' }])}>+ Tambah</Button>
                            </div>
                            {specEntries.map((spec, index) => (
                                <div key={index} className="grid grid-cols-[1fr_1.5fr_auto] gap-2">
                                    <Input
                                        placeholder="Label: Material"
                                        value={spec.key}
                                        onChange={(e) => setSpecEntries((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, key: e.target.value } : item))}
                                    />
                                    <Input
                                        placeholder="Nilai: 100% Recycled Polyester"
                                        value={spec.value}
                                        onChange={(e) => setSpecEntries((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, value: e.target.value } : item))}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-10 w-10 p-0 text-destructive"
                                        onClick={() => setSpecEntries((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Visibility Toggle */}
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <Label htmlFor="active" className="text-sm font-semibold">
                                    Tampilkan di Toko
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Produk aktif akan langsung tampil di etalase dan katalog pembeli.
                                </p>
                            </div>
                            <Switch id="active" checked={active} onCheckedChange={setActive} />
                        </div>

                        <Button
                            type="submit"
                            disabled={busy || uploadingImages || uploadingBanner}
                            className="w-full"
                        >
                            {busy ? 'Menyimpan Produk…' : 'Simpan Produk'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DIALOG: COURIER TRACKING / RESI INPUT FOR SHIPPING */}
            <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" /> Input Resi Pengiriman
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Masukkan nomor resi ekspedisi kurir untuk pesanan #{shippingOrder?.order_number}.
                    </DialogDescription>

                    <div className="space-y-4 pt-2">
                        <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
                            <p>
                                <span className="font-semibold text-muted-foreground">Penerima:</span>{' '}
                                {shippingOrder?.shipping_name}
                            </p>
                            <p>
                                <span className="font-semibold text-muted-foreground">Alamat:</span>{' '}
                                {shippingOrder?.shipping_address}, {shippingOrder?.shipping_city}{' '}
                                {shippingOrder?.shipping_postal}
                            </p>
                            <p>
                                <span className="font-semibold text-muted-foreground">Layanan:</span>{' '}
                                {shippingOrder?.courier}
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="resi-input">Nomor Resi / AWB Kurir</Label>
                            <Input
                                id="resi-input"
                                placeholder="Contoh: JNE8293819283 / SICEPAT0019283"
                                value={resiInput}
                                onChange={(e) => setResiInput(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShippingDialogOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                disabled={busy || !resiInput.trim()}
                                onClick={confirmShipping}
                                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Truck className="h-4 w-4" /> Konfirmasi Pengiriman (Shipped)
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Workspace>
    );
}
