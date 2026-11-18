/**
 * Lightweight i18n context — Indonesian (id) + English (en).
 * Stored in localStorage as "seaport-lang".
 * Usage: const { t, lang, setLang } = useI18n();
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Lang = 'id' | 'en';

export const translations = {
  en: {
    // Categories
    allCategories: 'All',
    accessories: 'Accessories',
    apparelCategory: 'Apparel',
    badminton: 'Badminton',
    basketballShoes: 'Basketball Shoes',
    cycling: 'Cycling',
    footballCleats: 'Football Cleats',
    running: 'Running',
    others: 'Others',
    seeDescForSize: 'Size: See Description / Specifications',
    filterByCategory: 'Filter by Category',
    // Nav
    newestDrop: 'Newest Drop',
    men: 'Men',
    women: 'Women',
    member: 'Member',
    search: 'Search',
    myAccount: 'My account / Member',
    storeManagement: 'Store Management',
    platformAdmin: 'Platform Admin',
    signOut: 'Sign out',
    signIn: 'Sign in',
    openCart: 'Open cart',
    openMenu: 'Open menu',
    // Announcement bar
    freeShipping: 'Free shipping across Indonesia for orders above Rp 1,000,000 · 100% Original Products',
    // Product page
    selectSize: 'Select size',
    selectSizeEU: 'Select size (EU)',
    adultSize: 'Adult · EU 39–45',
    kidsSize: 'Kids · EU 29–37',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    inStock: 'in stock',
    outOfStock: 'Out of stock',
    specifications: 'Specifications',
    youMayAlsoLike: 'You may also like',
    shipsAcrossIndonesia: 'Ships across Indonesia',
    officialAuthentic: '100% Official & Authentic',
    productNotFound: 'Product not found',
    backToShop: 'Back to shop',
    // Shop
    shopNow: 'Shop Now',
    exploreAll: 'Explore All',
    orderNow: 'Order Now',
    // Admin / seller
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    saveProduct: 'Save Product',
    saving: 'Saving…',
    productName: 'Product Name',
    price: 'Price (IDR)',
    category: 'Category',
    gender: 'Gender',
    collection: 'Collection / Brand',
    description: 'Product Description',
    visibleInShop: 'Visible in shop',
    includeKidsSizes: 'Include Kids Sizes (EU 29–37)',
    kidsSizesDesc: 'Enable to also set stock for EU 29–37 kids sizes',
    adultSizesSection: 'Adult Sizes (EU 39–45)',
    kidsSizesSection: 'Kids Sizes (EU 29–37)',
    // Theme
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    // Lang
    language: 'Language',
  },
  id: {
    // Categories
    allCategories: 'Semua',
    accessories: 'Aksesoris',
    apparelCategory: 'Pakaian',
    badminton: 'Badminton',
    basketballShoes: 'Sepatu Basket',
    cycling: 'Sepeda',
    footballCleats: 'Sepatu Bola',
    running: 'Lari',
    others: 'Lainnya',
    seeDescForSize: 'Ukuran: Cek Deskripsi / Spesifikasi',
    filterByCategory: 'Filter Kategori',
    // Nav
    newestDrop: 'Terbaru',
    men: 'Pria',
    women: 'Wanita',
    member: 'Member',
    search: 'Cari produk…',
    myAccount: 'Akun saya / Member',
    storeManagement: 'Kelola Toko',
    platformAdmin: 'Admin Platform',
    signOut: 'Keluar',
    signIn: 'Masuk',
    openCart: 'Buka keranjang',
    openMenu: 'Buka menu',
    // Announcement bar
    freeShipping: 'Gratis Ongkir Seluruh Indonesia untuk Pembelian di Atas Rp 1.000.000 · 100% Produk Original',
    // Product page
    selectSize: 'Pilih ukuran',
    selectSizeEU: 'Pilih ukuran (EU)',
    adultSize: 'Dewasa · EU 39–45',
    kidsSize: 'Anak · EU 29–37',
    addToCart: 'Tambah ke Keranjang',
    buyNow: 'Beli Sekarang',
    inStock: 'tersedia',
    outOfStock: 'Stok habis',
    specifications: 'Spesifikasi',
    youMayAlsoLike: 'Produk Serupa',
    shipsAcrossIndonesia: 'Pengiriman ke seluruh Indonesia',
    officialAuthentic: '100% Resmi & Original',
    productNotFound: 'Produk tidak ditemukan',
    backToShop: 'Kembali ke toko',
    // Shop
    shopNow: 'Beli Sekarang',
    exploreAll: 'Lihat Semua',
    orderNow: 'Pesan Sekarang',
    // Admin / seller
    addProduct: 'Tambah Produk',
    editProduct: 'Edit Produk',
    saveProduct: 'Simpan Produk',
    saving: 'Menyimpan…',
    productName: 'Nama Produk',
    price: 'Harga (IDR)',
    category: 'Kategori',
    gender: 'Gender',
    collection: 'Koleksi / Brand',
    description: 'Deskripsi Produk',
    visibleInShop: 'Tampilkan di Toko',
    includeKidsSizes: 'Tambah Ukuran Anak (EU 29–37)',
    kidsSizesDesc: 'Aktifkan untuk mengisi stok ukuran anak EU 29–37',
    adultSizesSection: 'Ukuran Dewasa (EU 39–45)',
    kidsSizesSection: 'Ukuran Anak (EU 29–37)',
    // Theme
    lightMode: 'Mode terang',
    darkMode: 'Mode gelap',
    // Lang
    language: 'Bahasa',
  },
} satisfies Record<Lang, Record<string, string>>;

export type TranslationKey = keyof typeof translations.en;

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem('seaport-lang');
      return stored === 'id' || stored === 'en' ? stored : 'id';
    } catch {
      return 'id';
    }
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('seaport-lang', l); } catch { /* SSR */ }
  };

  const t = (key: TranslationKey): string => translations[lang][key] ?? translations.en[key] ?? key;

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
