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
- **Form Admin (`seller.tsx`) & i18n (`src/lib/i18n.tsx`):** Tambahkan `Badminton` dan