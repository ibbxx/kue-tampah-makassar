# Setup Supabase — Kue Tampah

## 1. Jalankan SQL
- Buka project Supabase → **SQL Editor** → New query
- Copy seluruh isi `supabase/schema.sql` → Run

## 2. Isi environment
Salin `.env.example` → `.env`:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...   (anon / publishable key)
```

## 3. Buat user admin
1. Supabase Dashboard → **Authentication → Users → Add user** (email + password)
2. Copy UUID user → SQL Editor:
   ```sql
   insert into public.user_roles (user_id, role)
   values ('PASTE-UUID', 'admin');
   ```
3. Login di `/login`.

## 4. Upload gambar
Bucket `product-images` dipakai untuk produk. Bucket `site-images` dipakai untuk hero beranda dan konten website lain. Keduanya public read dan admin write.
