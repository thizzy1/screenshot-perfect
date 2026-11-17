# Frontend Final Specification - Seaport Official Store

## Aturan Wajib Arsitektur (Ikuti AGENTS.md)
- Hanya modifikasi atau buat file baru di dalam folder `src/` dan `public/`.
- **DILARANG KERAS** menyentuh folder `drizzle/`, `supabase/migrations/`, `.lovable/`, maupun file *auto-generated* (`src/integrations/supabase/types.ts` dan `src/routeTree.gen.ts`).
- **DILARANG MENGUBAH SKEMA WARNA BAWAAN:** Pertahankan palet warna asli proyek (latar gradien ungu gelap hero/banner, permukaan terang netral `#F5F5F5` / `#FFFFFF`, tombol kapsul putih, dan aksen tombol sesuai desain awal)[cite: 10]. Jangan mengubah warna badge atau teks menjadi warna baru yang tidak sesuai tema asli.
- Gunakan komponen Shadcn UI (`src/components/ui/`), Tailwind CSS, dan ikon dari `lucide-react`.

---

## Tugas 1: Kembalikan Path Logo Asli di Header (Jangan Pakai Logo Buatan AI)
**Target File:** `src/components/store/SiteHeader.tsx`

### Instruksi Perubahan:
- Hapus logo SVG atau wordmark buatan AI yang sebelumnya ditambahkan di `SiteHeader.tsx`.
- Kembalikan elemen logo di bagian kiri header agar memanggil file gambar logo asli dari aset statis (misalnya `/images/seaport-logo.png` atau path asli bawaan repositori sebelumnya) dengan tinggi proporsional (`h-8 w-auto object-contain`).
- Jika file gambar logo belum tersedia di lokal, biarkan elemen `<img>` tetap merujuk ke path aset tersebut (tanpa menggantinya dengan ikon SVG custom) agar nantinya langsung muncul otomatis saat logo diunggah ulang melalui Lovable.

---

## Tugas 2: Hero Section & Spotlight Banner Dinamis Tanpa Kotak Background (Floating Cutout Style)
**Target File:** `src/routes/index.tsx` (dan helper pemrosesan gambar di `src/lib/`).

### Masalah Saat Ini:
Foto produk dinamis yang ditarik dari database saat ini masih tampil di dalam bingkai/kotak putih atau abu-abu kaku dan terkena perubahan warna yang tidak diinginkan.

### Instruksi Perubahan:
1. **Pertahankan Gaya & Warna Asli Banner:**
   - Gunakan kembali latar belakang gradien ungu gelap asli (`KYRIE: THE RETURN` style)[cite: 10], posisi teks besar rata kiri (badge kategori kecil di atas, judul besar *uppercase* tebal, deskripsi singkat maksimal 2–3 baris, dan dua tombol kapsul di kiri bawah: tombol utama putih solid + tombol sekunder transparan gelap)[cite: 10].
   - Jangan mengubah warna teks atau menambahkan warna merah/neon baru yang merusak estetika asli[cite: 10].
2. **Tampilkan Objek Produk Murni Tanpa Kotak (Floating Cutout):**
   - **Hapus seluruh wadah/kotak/bingkai (`border`, `bg-*`, `card`)** di sekitar gambar produk pada *Hero Section* maupun *Spotlight Banner* kedua[cite: 10].
   - Objek produk (sepatu atau apparel dari `product.images[0]`) harus tampil besar, bebas, dan melayang langsung di sisi kanan (pada Hero) dan sisi kiri (pada Spotlight Banner) dengan bayangan jatuh alami di bawah objek (`drop-shadow-[0_25px_25px_rgba(0,0,0,0.45)]`) menyerupai tampilan sepatu pada kampanye awal[cite: 10].
   - **Auto-Transparansi Gambar Produk:** Implementasikan pemrosesan gambar sisi klien (menggunakan pustaka ringan seperti `@imgly/background-removal` atau *canvas background key-out* otomatis untuk latar putih/abu-abu terang `#F0F0F0`–`#FFFFFF`, serta mendukung file PNG transparan langsung) sehingga foto produk yang di-upload dari katalog otomatis hilang kotak latarnya saat dirender di Hero Section maupun Spotlight Banner.
   - Tambahkan juga field opsional **"Banner Cutout PNG (Opsional)"** pada form produk di dashboard Admin apabila admin ingin mengunggah foto PNG transparan khusus untuk banner.
3. **Sumber Data Otomatis:**
   - **Hero Section Utama:** Otomatis menarik produk aktif terbaru (`status = 'active'`, urut `created_at DESC`) dengan navigasi *slide* sederhana (maksimal 3 produk terbaru) dan tombol utama `"Shop Now"` yang mengarah ke `/product/$slug`.
   - **Spotlight Banner Kedua:** Otomatis menarik produk unggulan/terpopuler berikutnya (berbeda dari produk di Hero utama) dengan tata letak gambar produk bebas tanpa kotak di sisi kiri dan judul + tombol `"Order Now"` di sisi kanan. Jika hanya ada 1 produk aktif, sembunyikan banner kedua ini.

---

## Tugas 3: Konversi ke Official Single-Brand / Retail Store (Ala Nike, ANTA, Sports Station)
**Target File:** `src/routes/_authenticated/account.tsx`, `src/routes/_authenticated/seller.tsx`, `src/components/store/ProductCard.tsx`, `src/routes/product.$slug.tsx`, `src/components/store/SiteHeader.tsx`, dan halaman `Member`.

### Instruksi Perubahan:
1. **Hapus Fitur Pendaftaran Seller / Buka Toko bagi Pembeli:**
   - Hilangkan seluruh tombol *"Become a Seller"*, *"Open Store"*, atau formulir pendaftaran vendor pada halaman akun pembeli (`account.tsx`) maupun navbar. Website ini adalah **toko ritel resmi tunggal (B2C)**, bukan *marketplace* tempat pengguna bisa membuka toko.
2. **Batasi Dashboard Manajemen Produk & Pesanan Khusus Admin:**
   - Pastikan rute `/seller` (atau panel manajemen produk) hanya dapat diakses oleh akun yang memiliki hak akses **Admin Toko**. Jika pengguna biasa mengakses URL tersebut, arahkan otomatis ke `/` (*redirect*).
   - Di dalam dashboard Admin, pastikan tersedia tab/fitur untuk memperbarui status pesanan pembeli (`Paid` → `Processing` → `Shipped` beserta input nomor resi kurir → `Delivered`).
3. **Seragamkan Identitas Toko Resmi:**
   - Ubah seluruh tampilan nama vendor dinamis pada `ProductCard.tsx` dan `product.$slug.tsx` menjadi identitas brand tunggal **SEAPORT** / **SEAPORT OFFICIAL** (atau nama brand koleksi seperti `NIKE · OFFICIAL` / `ANTA · OFFICIAL`).
   - Ubah badge *"Verified seller"* di halaman detail produk menjadi **"100% Official & Authentic"**[cite: 10].
4. **Sempurnakan Bilah Pengumuman & Halaman Member:**
   - Tambahkan *announcement bar* tipis di atas header untuk info toko resmi (contoh: *"Gratis Ongkir Seluruh Indonesia untuk Pembelian di Atas Rp 1.000.000 · 100% Produk Original"*).
   - Pastikan tautan **Member** di navbar mengarah ke halaman informasi keanggotaan resmi **Seaport Member** (keuntungan akses rilisan terbaru, poin belanja, dan riwayat benefit akun).

---

## Tugas 4: Tambah Opsi Ukuran & Stok Anak (`Kids EU 29–37`) di Dashboard Admin
**Target File:** `src/routes/_authenticated/seller.tsx` (terintegrasi dengan `src/lib/sizing.ts`).

### Instruksi Perubahan:
1. Pada form **Tambah Produk** dan **Edit Produk** di dashboard Admin, tambahkan tombol preset cepat **Kids Shoes (`EU 29` – `EU 37`)** berdampingan dengan preset **Adult Shoes (`EU 39` – `EU 45`)** dan **Apparel (`XS` – `XXL`)**.
2. Klik preset **Kids Shoes** otomatis mengisi daftar varian `EU 29` hingga `EU 37` beserta kolom input stok masing-masing.
3. Tambahkan tombol **"+ Add Custom Size"** untuk menambah ukuran satuan secara manual (misalnya `EU 38`, `EU 46`, atau `All Size`) beserta jumlah stoknya.