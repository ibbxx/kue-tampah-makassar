## Website Kue Tampah Ratulangi — Plan

Website 2 sisi (User & Admin) untuk Kue Tampah cabang Ratulangi Makassar, mengikuti mockup pink/magenta + hijau.

### Catatan penting
Anda memilih **mengelola SQL sendiri di Supabase**. Saya akan:
- Membuat seluruh frontend + integrasi Supabase (pakai client browser dengan publishable key).
- Memberikan **file SQL siap-pakai** (`supabase/schema.sql`) berisi tabel, RLS, trigger, role admin, storage bucket — Anda jalankan di SQL Editor Supabase.
- Anda mengisi `.env` dengan `VITE_SUPABASE_URL` & `VITE_SUPABASE_PUBLISHABLE_KEY` Anda sendiri.

---

### 1. Struktur Route (TanStack Start)

**Sisi User (public):**
```
/                  Beranda — Hero, Featured produk, Kenapa Kami, Testimoni, FAQ, CTA
/produk             Katalog + Search + filter kategori
/produk/$slug       Detail produk (gambar, harga, qty, tambah ke keranjang)
/keranjang          Cart + checkout (kirim WA + simpan order)
/tentang            Profil brand, visi-misi, cerita
/artikel            List blog
/artikel/$slug      Detail artikel
/kontak             Form kontak + map (Jl. DR. Ratulangi, Mariso, Makassar) + WA/IG
```

**Sisi Admin (`/_authenticated/_admin/*`):**
```
/admin              Dashboard (statistik: total produk, order baru, pesan kontak, stok rendah)
/admin/produk       CRUD produk
/admin/stok         Update stok cepat (real-time)
/admin/kategori     CRUD koleksi/kategori
/admin/artikel      CRUD blog
/admin/order        List order masuk (dari checkout)
/admin/pesan        Inbox form kontak
/admin/panduan      Dokumentasi penggunaan admin
/login              Login admin (Supabase Auth email/password)
```

Layout admin pakai shadcn Sidebar (collapsible).

---

### 2. Schema Database (di file `supabase/schema.sql`)

Tabel:
- `categories` (id, name, slug, description)
- `products` (id, name, slug, description, price, stock, category_id, image_url, is_featured, is_active, created_at)
- `articles` (id, title, slug, excerpt, content, cover_url, published, created_at)
- `orders` (id, customer_name, phone, address, notes, total, status, created_at)
- `order_items` (id, order_id, product_id, name, price, qty, subtotal)
- `contact_messages` (id, name, email, phone, message, created_at, is_read)
- `user_roles` (id, user_id, role enum 'admin'|'user') — pola aman, tidak di profiles
- Function `has_role(uuid, app_role)` SECURITY DEFINER
- Storage bucket `product-images` (public read, admin write)

RLS:
- Public: SELECT pada products/articles (where is_active/published), categories.
- Public: INSERT pada orders, order_items, contact_messages.
- Admin (via `has_role`): full akses semua tabel.

---

### 3. Checkout Flow (kedua-duanya)

User isi form di `/keranjang` → klik **Checkout**:
1. INSERT row ke `orders` + `order_items` di Supabase.
2. Buka `https://wa.me/6282311113823?text=...` dengan ringkasan pesanan terformat.
3. Order muncul di `/admin/order` dengan status `pending`.

---

### 4. Design System (mockup-driven)

`src/styles.css` token (oklch):
- `--primary`: pink/magenta ~ `oklch(0.62 0.22 0)` (tombol utama, harga, brand)
- `--accent`: hijau ~ `oklch(0.62 0.18 150)` (badge "Best Seller", CTA "Tambah ke Keranjang")
- `--background`: putih bersih, `--muted`: krem soft
- Font heading: serif elegan (Playfair Display); body: Inter
- Card produk dengan rounded-xl, badge corner pink/hijau, ikon Lucide

Komponen reusable: `ProductCard`, `CategoryCard`, `TestimonialCard`, `FeatureBadge`, `Hero`, `Navbar`, `Footer`, `AdminSidebar`, `StatCard`, `DataTable`.

---

### 5. State & Data

- **Cart**: Zustand + persist localStorage (qty, items).
- **Data fetching**: TanStack Query langsung pakai `supabase` browser client (RLS handle keamanan).
- **Search produk**: client-side filter + debounce.
- **Auth admin**: `supabase.auth` email/password, cek `has_role` untuk gate `/admin/*`.

---

### 6. Konten Awal

Produk & artikel **kosong** — admin isi sendiri. Saya buat:
- 4 kategori seed di SQL (Tampah Premium, Tampah Mini, Tampah Spesial, Tampah Keluarga) supaya UI tidak kosong.
- Halaman empty-state yang ramah ("Belum ada produk, admin sedang menyiapkan").
- Konten statis: Tentang Kami (cerita Kue Tampah, jajanan Makassar), FAQ, info kontak (alamat, WA, jam buka 06.00-20.00).

---

### 7. Deliverables Teknis

1. `supabase/schema.sql` — **satu file SQL** untuk Anda paste ke SQL Editor (tabel + RLS + role + bucket + seed kategori + cara membuat user admin pertama).
2. `supabase/README.md` — langkah singkat: jalankan SQL, isi `.env`, buat user admin via Supabase Dashboard, INSERT 1 row di `user_roles`.
3. `.env.example` dengan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Semua route, komponen UI, integrasi cart & checkout, dashboard admin CRUD lengkap.
5. SEO per route (head meta title/description/og unik).

---

### Yang TIDAK termasuk
- Payment gateway (hanya WA + simpan order).
- Email notifikasi (opsional nanti).
- Multi-cabang (hanya Ratulangi).
