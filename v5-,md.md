# SEAPORT OFFICIAL STORE — MASTER SPECIFICATION & UPGRADE BLUEPRINT

## 0. Arsitektur Dasar & Aturan Modifikasi
- **Stack:** TanStack Start, React 19, Tailwind CSS, dan Supabase (`gacfmsnjscwflpaovwkq.supabase.co`).
- **Prinsip Non-Destructive (Wajib):** Lakukan perubahan secara inkremental di atas struktur kode yang sudah ada. Jangan menghapus fitur yang sudah berjalan (palet warna identitas toko, keranjang belanja, *Size Guide*, filter gender, maupun manajemen katalog lama).
- **Eksekusi Bertahap (3 Fase):** Dokumen ini dibagi menjadi **Fase 1**, **Fase 2**, dan **Fase 3** untuk menjaga stabilitas kode dan efisiensi konsumsi token. Selesaikan dan verifikasi `npx tsc --noEmit` di setiap akhir fase sebelum berpindah ke fase berikutnya.

---

## FASE 1: Autentikasi Mandiri, Otorisasi Toko Tunggal, Moderasi Admin, & Kategori Baru

### 1. Model Bisnis Toko Resmi Tunggal (*Single-Brand Official Retail Store B2C*)
- Website ini adalah toko ritel resmi tunggal milik satu pengelola (**1 akun Admin tunggal**), **bukan** platform *marketplace* publik.
- Hapus total seluruh tombol, tautan, maupun form pendaftaran penjual baru (*"Become a Seller"*, *"Daftar Jadi Penjual"*) di header (`SiteHeader.tsx`), footer, dan halaman akun (`account.tsx`).
- Hanya akun dengan `role === 'admin'` yang dapat mengakses rute pengelolaan `/seller`; akun pengguna biasa murni berperan sebagai pembeli/member.

### 2. Penghapusan Ketergantungan Lovable OAuth & Migrasi ke Supabase Native Auth (`src/routes/auth.tsx`)
- Hapus total tombol **"Continue with Google"** dan **"Sign in with Lovable"**, pemisah **"OR"**, serta seluruh pemanggilan endpoint OAuth internal Lovable (`/~oauth/initiate` atau `@lovable.dev/cloud-auth-js`) agar tidak memicu *404 Page Not Found* saat dijalankan di `localhost` maupun server produksi mandiri.
- Gunakan murni formulir **Email & Password** bawaan **Supabase Auth** (`supabase.auth.signInWithPassword` dan `supabase.auth.signUp`).
- Tambahkan tautan/modal **"Forgot Password?"** menggunakan `supabase.auth.resetPasswordForEmail` agar akun lama yang sebelumnya terdaftar lewat Google OAuth dapat mengatur password-nya sendiri langsung dari aplikasi.

### 3. Larangan Transaksi Pembelian untuk Akun Admin (*Admin Cannot Order*)
- Akun pengelola dengan `role === 'admin'` **dilarang** memasukkan produk ke keranjang maupun melakukan checkout/pemesanan barang sendiri.
- **UI Guard (`product.$slug.tsx`):** Jika user aktif memiliki `role === 'admin'`, sembunyikan/nonaktifkan tombol **Add to Cart** dan **Buy Now**, lalu ganti dengan tombol pintasan *"Admin Mode — Manage Product"* yang mengarah ke `/seller`.
- **Cart & Checkout Guard (`CartDrawer` & `checkout.tsx`):** Blokir proses checkout jika akun aktif adalah `admin` dengan pesan pemberitahuan yang jelas.

### 4. Fitur Blokir / *Ban* Akun Pembeli oleh Admin (*Warranty & Abuse Protection*)
- **Database (`profiles`):** Pastikan tabel `profiles` (atau tabel status user) memiliki kolom `is_banned` (`boolean`, default `false`) dan `ban_reason` (`text`, nullable).
- **Kontrol Moderasi di Dashboard Admin (`/seller`):** Tambahkan tab/panel **User Moderation** bagi Admin untuk melihat daftar pembeli dan melakukan aksi **Ban** atau **Unban** beserta input alasan pemblokiran (contoh: *"Penyalahgunaan klaim garansi / penukaran barang berulang"*).
- **Enforcement:** Jika akun dengan `is_banned === true` mencoba login, menambahkan barang ke keranjang, checkout, atau mengajukan klaim garansi/retur, tolak aksi tersebut dan tampilkan pesan bahwa akun telah diblokir karena pelanggaran ketentuan layanan.

### 5. Penambahan Kategori Baru: `Badminton` & `Cycling`
- **Bilah Filter Katalog (`src/routes/index.tsx`):** Tambahkan tombol *pill* **`Badminton`** dan **`Cycling`** ke bilah filter utama di sisi kiri garis pemisah gender sehingga urutannya menjadi:
  `All` | `Accessories` | `Apparel` | `Badminton` | `Basketball Shoes` | `Cycling` | `Running` — `Men` | `Women`
- **Form Admin (`seller.tsx`) & i18n (`src/lib/i18n.tsx`):** Tambahkan `Badminton` dan `Cycling` ke pilihan dropdown kategori Admin beserta terjemahan EN/ID yang sesuai.

---

## FASE 2: Multi-Colorway, Logika Ukuran Per Kategori, Spesifikasi Dinamis, & Out of Stock

### 6. Logika Ukuran & Tampilan Otomatis Berdasarkan Kategori Produk
- **Sepatu (`Basketball Shoes`, `Running`):**
  - *Admin (`seller.tsx`):* Wajib menyertakan matriks stok ukuran sepatu **Adult (`EU 39–45`)** serta toggle opsional **Kids (`EU 29–37`)**.
  - *Halaman Produk (`product.$slug.tsx`):* Tampilkan kotak pemilih ukuran `EU` beserta tombol *Size Guide* konversi **Insole / Outsole (cm)**.
- **Pakaian (`Apparel`):**
  - *Admin (`seller.tsx`):* Khusus baju/celana/jersey/jaket—muat pilihan ukuran **Adult (`XS` – `XXL`)** beserta toggle opsional **Kids**.
  - *Halaman Produk (`product.$slug.tsx`):* Tampilkan kotak pemilih ukuran pakaian (`XS–XXL`) beserta tombol *Size Guide* konversi **Lebar Dada (LD) x Panjang (P)**.
- **Aksesoris (`Accessories`):**
  - *Admin (`seller.tsx`):* Sembunyikan pemilih varian ukuran—Admin cukup menginput **Total Stok** (disimpan internal sebagai `'One Size'`) dan menuliskan detail dimensi pada **Deskripsi / Specifications**.
  - *Halaman Produk (`product.$slug.tsx`):* Sembunyikan kotak pemilih ukuran dan tombol *Size Guide*, ganti dengan keterangan **"Ukuran: Cek Deskripsi / Spesifikasi"** sehingga pembeli dapat langsung klik **Add to Cart**.
- **Kategori Campuran (`Badminton` & `Cycling`):**
  - *Admin (`seller.tsx`):* Sediakan pemilih **Sub-Tipe Ukuran** saat Admin memilih kategori `Badminton` atau `Cycling`:
    1. **Sepatu (*Court / Cycling Shoes*):** Ukuran sepatu `EU` + *Size Guide* Insole/Outsole.
    2. **Pakaian (*Jersey / Apparel*):** Ukuran pakaian `XS–XXL` + *Size Guide* LD x P.
    3. **Peralatan & Aksesoris (*Raket, Kok, Tas, Grip, Helm, Botol, Toe Straps*):** Mode `'One Size'` (input total stok saja, detail teknis di Spesifikasi).

### 7. Dukungan Multi-Colorway pada Satu Halaman Produk (*Colorway Switcher*)
- **Admin (`seller.tsx`):** Izinkan Admin menambahkan 1 atau lebih varian **Colorway** dalam satu produk. Setiap *colorway* memiliki:
  1. Nama warna & kode warna hex (*swatch*).
  2. Galeri foto mandiri (1 atau lebih foto).
  3. Tabel stok ukuran mandiri sesuai kategori produk.
- **Halaman Detail Produk (`product.$slug.tsx`):** Tampilkan pemilih *Colorway* (lingkaran *swatch* / *thumbnail* mini + nama warna aktif) di atas pemilih ukuran. Mengklik *colorway* lain langsung mengganti galeri foto, ketersediaan ukuran, dan status stok secara mulus tanpa reload halaman.
- **Kartu Katalog & Keranjang:** Tampilkan indikator jumlah warna (mis. *"3 Colors"* atau titik *swatch*) di `ProductCard.tsx` jika colorway > 1, dan sertakan nama *colorway* yang dipilih pada item keranjang & detail pesanan.

### 8. Input Manual Spesifikasi Produk Dinamis (Menghapus *Hardcoded* `banner_image`)
- Hapus teks mentah/hardcoded `banner_image` pada bagian **SPECIFICATIONS** di `product.$slug.tsx`.
- Tambahkan repeater input pasangan **Label & Nilai (*Key-Value*)** yang dinamis pada form Admin (`seller.tsx`) agar Admin dapat mengisi spesifikasi teknis secara bebas (contoh: `Material: 100% Recycled Polyester`, `Berat: 4U (83g)`, `Outsole: Non-Marking Rubber`) dan menyimpannya ke kolom `specifications` (JSONB/array) di database.
- Pada halaman detail produk, tampilkan daftar spesifikasi tersebut dalam tata letak tabel/daftar yang rapi (dan sembunyikan bagian SPECIFICATIONS jika memang kosong).

### 9. Indikator & Penanganan Stok Habis (*Out of Stock*)
- Varian ukuran dengan stok `0` otomatis tampil redup/tercoret (`line-through`) dan tidak dapat diklik pembeli.
- Jika total stok seluruh varian/colorway pada produk bernilai `0`, tampilkan badge **"Out of Stock"** pada kartu katalog (`ProductCard.tsx`) dan nonaktifkan tombol **Add to Cart / Buy Now** pada `product.$slug.tsx`.

---

## FASE 3: Sistem Galeri Foto Presisi, Konsistensi Background Katalog, Tema/i18n, & Responsivitas

### 10. Perbaikan Bug Foto Produk Terpotong / "Beleberan" & *Horizontal Overflow*
- **Proporsi Gambar Utuh:** Terapkan `object-contain w-full h-full` dengan ruang *padding* aman (`p-4 sm:p-6`) pada seluruh bingkai foto galeri utama dan kartu katalog (hindari `object-cover` yang memotong ujung sepatu/produk).
- **Kunci Batas Lebar Layar:** Tambahkan `overflow-x-hidden` pada root wrapper halaman serta `w-full max-w-full min-w-0 overflow-hidden` pada container galeri dan wrapper deretan *thumbnail* (`POV 1/6`). Pastikan barisan *thumbnail* menggunakan `overflow-x-auto max-w-full` agar dapat digulir secara internal tanpa menarik lebar halaman keluar layar mobile.

### 11. Algoritma *Flood-Fill Auto-Cutout* pada Gambar Hero Produk
- Pastikan pemrosesan *auto-cutout* latar belakang pada gambar utama produk menggunakan algoritma **BFS/DFS Flood-Fill yang dimulai dari piksel tepi luar kanvas** (dengan toleransi warna latar), sehingga latar belakang polos/putih bersih **tanpa melubangi atau menghapus area berwarna putih yang berada di bagian dalam objek produk** (seperti logo Swoosh putih atau bagian putih jersey).

### 12. Pemerataan Warna Background Kartu Katalog (*Shop All* & Filter Kategori) vs. Hero Home
- **Pertahankan Kode Transparan pada Hero Banner Home:** Jangan mengubah logika latar belakang transparan (*auto-cutout*) pada komponen **Hero Banner / Carousel utama di halaman Home** (`index.tsx`), sehingga gambar produk unggulan tetap menyatu mulus di atas gradien latar ungu gelap.
- **Seragamkan Warna Background di *Shop All* & Filter Kategori (`ProductCard.tsx`):** Pada seluruh kartu produk di grid **Shop All** maupun saat filter kategori aktif (`Accessories`, `Apparel`, `Badminton`, `Basketball Shoes`, `Cycling`, `Running`, `Men`, `Women`), seragamkan wadah/bingkai foto produk memakai satu latar belakang permukaan yang konsisten (misalnya surface abu-abu lembut yang seragam di Light Mode dan permukaan gelap netral yang seragam di Dark Mode, dipadukan dengan `mix-blend-multiply` pada Light Mode jika foto berlatar putih) agar tidak terlihat belang antara kartu yang berlatar putih murni dan kartu yang berlatar abu-abu.

### 13. Navigasi Galeri Multi-Foto (*Tombol Kiri/Kanan & Seamless Infinite Loop*)
- **Kondisional Berdasarkan Jumlah Foto (`images.length`):**
  - Jika `images.length <= 1`: Biarkan foto tampil statis tanpa tombol panah kiri/kanan. Fitur geser otomatis aktif jika Admin mengedit produk dan menambahkan foto ke-2 atau lebih.
  - Jika `images.length > 1`: Tampilkan tombol dan area klik di sisi **kiri** (`prev`) dan **kanan** (`next`) pada kartu katalog maupun galeri utama `product.$slug.tsx`.
- **Seamless Infinite Loop:** Mengklik kanan pada foto terakhir berputar mulus (*seamless* tanpa lompatan visual kasar) kembali ke foto pertama, dan mengklik kiri pada foto pertama berputar mulus ke foto terakhir, sekaligus menyinkronkan status aktif pada deretan *thumbnail*.

### 14. Interaksi Foto: *Desktop Magnifier Zoom* & *Seamless Lightbox Fullscreen*
- **Khusus Desktop (`@media (hover: hover) and (pointer: fine)`):** Saat kursor mouse/trackpad diarahkan dan digerakkan di atas foto utama produk (`product.$slug.tsx`), aktifkan efek kaca pembesar (*hover zoom* ~2.2x) yang titik fokusnya mengikuti pergerakan kursor secara real-time, dan kembali normal saat kursor keluar. Nonaktifkan efek ini pada perangkat layar sentuh (`pointer: coarse`).
- **Semua Perangkat (Desktop, Tablet, Mobile):** Saat pengguna mengklik/mengetuk **area tengah foto** (terpisah dari tombol panah kiri/kanan), buka modal **Lightbox Fullscreen** beresolusi penuh dengan animasi transisi *scale & fade* yang mulus, lengkap dengan navigasi foto berikutnya/sebelumnya dan tombol tutup (`X`, `Esc`, atau klik backdrop).

### 15. Bilah Tema (*Dark / Light Mode*) & Terjemahan Bahasa Indonesia (`EN / ID`)
- Integrasikan `src/lib/theme.tsx` dan `src/lib/i18n.tsx` secara menyeluruh pada `SiteHeader.tsx` dan seluruh rute utama sehingga pengguna dapat beralih antara **Light Mode / Dark Mode** serta **Bahasa Inggris (`EN`) / Bahasa Indonesia (`ID`)** secara real-time tanpa merusak kontras warna komponen.

### 16. Responsivitas & Penyesuaian Tampilan Dinamis Lintas Perangkat (Mobile, Tablet, & Desktop)
- Pastikan seluruh komponen beradaptasi mulus saat terjadi perubahan ukuran layar atau rotasi perangkat (*Mobile `< 640px`*, *Tablet `640px–1024px`*, *Desktop `> 1024px`*) tanpa elemen bertumpuk maupun *horizontal overflow*:
  - **Header (`SiteHeader.tsx`):** Kemas navigasi, toggle tema, pemilih bahasa, dan akses akun/keranjang ke dalam *mobile drawer/menu* yang ringkas pada layar kecil, dan sejajar rapi di tablet/desktop.
  - **Bilah Filter & Grid Katalog (`index.tsx`):** Bilah *pill* kategori mendukung *horizontal scroll* ramah sentuhan di mobile; grid produk beradaptasi dari **1–2 kolom (Mobile)** $\rightarrow$ **2–3 kolom (Tablet)** $\rightarrow$ **3–4 kolom (Desktop)**.
  - **Halaman Detail Produk (`product.$slug.tsx`):** Susunan 1 kolom vertikal di mobile/tablet dengan tombol panah galeri ramah sentuhan jari, dan *2-column split* di desktop.
  - **Dashboard Admin (`seller.tsx`):** Gunakan *responsive grid/stack* pada form input dan `overflow-x-auto` pada tabel manajemen produk, stok, serta moderasi akun agar tetap nyaman dioperasikan dari perangkat mana pun.