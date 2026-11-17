# Frontend Task Specification — Seaport Marketplace

## Aturan Wajib (Patuhi `AGENTS.md`)
- **Area Kerja:** Hanya buat atau modifikasi file di dalam folder `src/` dan `public/`.
- **Area Terlarang:** DILARANG menyentuh folder `drizzle/`, `supabase/migrations/`, `.lovable/`, maupun file yang di-generate otomatis (`src/integrations/supabase/types.ts`, `src/routeTree.gen.ts`).
- **Standar UI:** Gunakan komponen Shadcn UI yang sudah tersedia di `src/components/ui/` (`Dialog`, `Tabs`, `Table`, `Button`, `Badge`) dan ikon dari `lucide-react`. Pertahankan estetika desain *sportswear* bersih dan modern yang sudah ada.

---

## Tugas 1: Komponen `SizeGuideModal.tsx` (Perbandingan Ukuran Apparel & Sepatu)
Buat komponen baru di `src/components/store/SizeGuideModal.tsx` dan integrasikan tombol pemicunya (**"Panduan Ukuran / Size Guide"**) di sebelah label pilihan ukuran pada halaman detail produk (`src/routes/product.$slug.tsx`).

### Spesifikasi Tab & Data Tabel:
Gunakan komponen `Tabs` di dalam modal agar pembeli dapat berpindah antara panduan **Apparel (Pakaian)** dan **Footwear (Sepatu)** (atau otomatis membuka tab yang sesuai dengan kategori produk yang sedang dibuka):

1. **Tab 1: Apparel / Pakaian (Perbandingan LD × P)**
   Tampilkan tabel panduan ukuran standar *sportswear* dengan kolom **Size**, **Lebar Dada (LD)**, **Panjang Baju (P)**, dan **Rekomendasi Tinggi/Berat**:
   - **XS**: LD 46 cm × P 66 cm (Tinggi 155–162 cm)
   - **S**: LD 48 cm × P 68 cm (Tinggi 160–168 cm)
   - **M**: LD 50 cm × P 70 cm (Tinggi 165–173 cm)
   - **L**: LD 53 cm × P 73 cm (Tinggi 170–178 cm)
   - **XL**: LD 56 cm × P 76 cm (Tinggi 175–183 cm)
   - **XXL**: LD 59 cm × P 79 cm (Tinggi 180–190 cm)
   - *Catatan bawah tabel:* Toleransi jahitan ±1–2 cm. Pengukuran Lebar Dada (LD) diukur mendatar dari ketiak kiri ke ketiak kanan.

2. **Tab 2: Footwear / Sepatu (Perbandingan Panjang Insole & Outsole)**
   Tampilkan tabel konversi ukuran sepatu (mencakup ukuran dewasa EU 39–45 serta ukuran anak/GS EU 29–37 sesuai `src/lib/sizing.ts`) dengan kolom **EU**, **US**, **UK**, **Panjang Insole (cm)**, dan **Estimasi Panjang Outsole (cm)**:
   - **EU 36**: US 4.5 | UK 3.5 | Insole 22.5 cm | Outsole ±24.5 cm
   - **EU 37**: US 5 | UK 4 | Insole 23.0 cm | Outsole ±25.0 cm
   - **EU 38**: US 5.5 | UK 4.5 | Insole 24.0 cm | Outsole ±26.0 cm
   - **EU 39**: US 6.5 | UK 5.5 | Insole 24.5 cm | Outsole ±26.5 cm
   - **EU 40**: US 7 | UK 6 | Insole 25.0 cm | Outsole ±27.0 cm
   - **EU 41**: US 8 | UK 7 | Insole 26.0 cm | Outsole ±28.0 cm
   - **EU 42**: US 8.5 | UK 7.5 | Insole 26.5 cm | Outsole ±28.5 cm
   - **EU 43**: US 9.5 | UK 8.5 | Insole 27.5 cm | Outsole ±29.5 cm
   - **EU 44**: US 10 | UK 9 | Insole 28.0 cm | Outsole ±30.0 cm
   - **EU 45**: US 11 | UK 10 | Insole 29.0 cm | Outsole ±31.0 cm
   - *(Sertakan juga sub-tabel atau filter untuk ukuran Kids EU 29–35 dengan selisih insole ±18.0–22.0 cm dan outsole +1.8 cm dari insole).*
   - *Tips pengukuran di bawah tabel:* Disarankan memilih ukuran dengan panjang **Insole +0.5 cm hingga +1.0 cm** lebih panjang dari telapak kaki asli untuk sepatu basket/lari.

---

## Tugas 2: Multi-Foto Produk (3+ POV Foto per Produk)
Kolom `images` pada tabel `products` di database Supabase sudah bertipe array (`text[]`). Perbarui antarmuka *frontend* di dua lokasi berikut agar Admin/Seller dapat mengunggah banyak sudut foto (POV) dan pembeli dapat melihat semuanya:

1. **Form Tambah/Edit Produk di Dashboard Seller & Admin (`src/routes/_authenticated/seller.tsx`):**
   - Ubah input unggah gambar produk agar mendukung **multiple upload / daftar galeri foto** (minimal bisa menambah 3 hingga 5 foto POV berbeda untuk 1 produk yang sama).
   - Gunakan helper unggah ke Supabase Storage yang sudah ada (`src/lib/upload.ts`) untuk setiap file yang dipilih, lalu simpan seluruh URL hasil unggahan ke dalam array `images: string[]` saat menyimpan produk.
   - Tampilkan pratinjau (*thumbnail preview*) semua foto yang sudah diunggah beserta tombol **hapus per foto** dan tombol **jadikan foto utama (geser ke urutan pertama)** agar admin mudah mengatur foto sampul produk.

2. **Galeri Multi-POV di Halaman Detail Produk (`src/routes/product.$slug.tsx`):**
   - Pastikan halaman detail produk membaca seluruh array `product.images`.
   - Tampilkan gambar utama berukuran besar di atas/kanan, dan deretan **thumbnail POV** yang dapat diklik di bagian bawah/sampingnya untuk mengganti gambar utama yang sedang dilihat.
   - Tambahkan indikator aktif (border tebal) pada thumbnail yang sedang dipilih.

---

## Tugas 3: Peningkatan Katalog & Footer Global (Opsional / Pelengkap)
1. **Filter Ukuran & Rentang Harga di `/shop` (`src/routes/shop.tsx`):**
   - Tambahkan filter cepat berdasarkan ketersediaan ukuran (misalnya tombol chip ukuran `40`, `41`, `42`, `43`, `M`, `L`, `XL`) serta filter toggle **"Hanya Stok Tersedia (In Stock)"**.
2. **Footer Global (`src/components/store/SiteFooter.tsx` & `src/routes/__root.tsx`):**
   - Tambahkan komponen footer minimalis di bagian bawah seluruh halaman yang menampilkan identitas brand Seaport, tautan navigasi kategori, jaminan keaslian produk (*100% Authentic Sportswear*), dan badge metode pembayaran (QRIS, Virtual Account, E-Wallet).