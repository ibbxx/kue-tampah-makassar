-- =====================================================================
-- KUE TAMPAH RATULANGI — Supabase Schema
-- Jalankan SELURUH file ini di Supabase SQL Editor (sekali).
-- =====================================================================

-- 1. ENUM untuk role
do $$ begin
  create type public.app_role as enum ('admin', 'user');
exception when duplicate_object then null; end $$;

-- =====================================================================
-- 2. TABLES
-- =====================================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null default 0,
  stock integer not null default 0,
  category_id uuid references public.categories(id) on delete set null,
  image_url text,
  is_featured boolean default false,
  is_active boolean default true,
  badge text, -- e.g. 'Best Seller', 'Baru'
  created_at timestamptz default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  cover_url text,
  published boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  address text,
  notes text,
  total numeric(12,2) not null default 0,
  status text not null default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  price numeric(12,2) not null,
  qty integer not null,
  subtotal numeric(12,2) not null
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.homepage_hero (
  id text primary key default 'home',
  eyebrow text not null default 'Kue Tradisional, Rasa Istimewa',
  title text not null default 'Kue Tampah Khas',
  highlight_text text not null default 'Makassar',
  description text not null default 'Aneka kue tradisional dibuat dengan bahan berkualitas dan cinta — siap memeriahkan momen spesial keluarga Anda.',
  primary_button_label text not null default 'Belanja Sekarang',
  primary_button_url text not null default '/produk',
  secondary_button_label text not null default 'Lihat Produk',
  secondary_button_url text not null default '/produk',
  image_url text,
  image_alt text not null default 'Aneka kue tampah khas Makassar',
  is_active boolean default true,
  updated_at timestamptz default now(),
  constraint homepage_hero_singleton check (id = 'home')
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null default 'user',
  created_at timestamptz default now(),
  unique (user_id, role)
);

-- =====================================================================
-- 3. private.has_role() — SECURITY DEFINER, bypass RLS recursion
-- =====================================================================
-- Buat skema private jika belum ada
create schema if not exists private;

-- Hapus fungsi lama jika ada di public skema
drop function if exists public.has_role(uuid, text);
drop function if exists public.has_role(uuid, public.app_role);

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- Berikan hak penggunaan skema dan eksekusi fungsi
grant usage on schema private to anon, authenticated, service_role;
grant execute on function private.has_role(uuid, public.app_role) to anon, authenticated, service_role;

-- =====================================================================
-- 4. RLS
-- =====================================================================
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.articles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.contact_messages enable row level security;
alter table public.homepage_hero enable row level security;
alter table public.user_roles enable row level security;

-- categories: public read, admin write
drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all" on public.categories for select using (true);
drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all" on public.categories for all
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

-- products: public read aktif, admin write
drop policy if exists "products_select_active" on public.products;
create policy "products_select_active" on public.products for select using (is_active or (auth.uid() is not null and private.has_role(auth.uid(), 'admin')));
drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products for all
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

-- articles: public read published, admin write
drop policy if exists "articles_select_published" on public.articles;
create policy "articles_select_published" on public.articles for select using (published or (auth.uid() is not null and private.has_role(auth.uid(), 'admin')));
drop policy if exists "articles_admin_all" on public.articles;
create policy "articles_admin_all" on public.articles for all
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

-- orders: public INSERT (anonymous checkout), admin SELECT/UPDATE
drop policy if exists "orders_insert_any" on public.orders;
create policy "orders_insert_any" on public.orders for insert with check (
  customer_name is not null and length(trim(customer_name)) > 0 and
  phone is not null and length(trim(phone)) > 0
);
drop policy if exists "orders_admin_select" on public.orders;
create policy "orders_admin_select" on public.orders for select using (private.has_role(auth.uid(), 'admin'));
drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders for update using (private.has_role(auth.uid(), 'admin'));
drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete" on public.orders for delete using (private.has_role(auth.uid(), 'admin'));

-- order_items: same pattern
drop policy if exists "order_items_insert_any" on public.order_items;
create policy "order_items_insert_any" on public.order_items for insert with check (
  qty > 0 and price >= 0
);
drop policy if exists "order_items_admin_select" on public.order_items;
create policy "order_items_admin_select" on public.order_items for select using (private.has_role(auth.uid(), 'admin'));

-- contact_messages: public INSERT, admin read/update
drop policy if exists "contact_insert_any" on public.contact_messages;
create policy "contact_insert_any" on public.contact_messages for insert with check (
  name is not null and length(trim(name)) > 0 and
  message is not null and length(trim(message)) > 0
);
drop policy if exists "contact_admin_all" on public.contact_messages;
create policy "contact_admin_all" on public.contact_messages for all
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

-- homepage_hero: public read, admin write
drop policy if exists "homepage_hero_select_active" on public.homepage_hero;
create policy "homepage_hero_select_active" on public.homepage_hero for select using (is_active or (auth.uid() is not null and private.has_role(auth.uid(), 'admin')));
drop policy if exists "homepage_hero_admin_all" on public.homepage_hero;
create policy "homepage_hero_admin_all" on public.homepage_hero for all
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

-- user_roles: only admins can manage; users can read their own
drop policy if exists "user_roles_self_read" on public.user_roles;
create policy "user_roles_self_read" on public.user_roles for select using (auth.uid() = user_id or (auth.uid() is not null and private.has_role(auth.uid(), 'admin')));
drop policy if exists "user_roles_admin_all" on public.user_roles;
create policy "user_roles_admin_all" on public.user_roles for all
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

create table if not exists public.site_settings (
  id text primary key default 'global',
  about_image_url text,
  updated_at timestamptz default now(),
  constraint site_settings_singleton check (id = 'global')
);

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read" on public.site_settings for select using (true);

drop policy if exists "site_settings_admin_all" on public.site_settings;
create policy "site_settings_admin_all" on public.site_settings for all
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

-- =====================================================================
-- 5. STORAGE BUCKET untuk gambar produk
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images' and (auth.uid() is not null and private.has_role(auth.uid(), 'admin')));

drop policy if exists "product_images_admin_write" on storage.objects;
create policy "product_images_admin_write" on storage.objects
  for insert with check (bucket_id = 'product-images' and private.has_role(auth.uid(), 'admin'));

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects
  for update using (bucket_id = 'product-images' and private.has_role(auth.uid(), 'admin'));

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'product-images' and private.has_role(auth.uid(), 'admin'));

-- Bucket untuk gambar konten website seperti hero homepage
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

drop policy if exists "site_images_public_read" on storage.objects;
create policy "site_images_public_read" on storage.objects
  for select using (bucket_id = 'site-images' and (auth.uid() is not null and private.has_role(auth.uid(), 'admin')));

drop policy if exists "site_images_admin_write" on storage.objects;
create policy "site_images_admin_write" on storage.objects
  for insert with check (bucket_id = 'site-images' and private.has_role(auth.uid(), 'admin'));

drop policy if exists "site_images_admin_update" on storage.objects;
create policy "site_images_admin_update" on storage.objects
  for update using (bucket_id = 'site-images' and private.has_role(auth.uid(), 'admin'));

drop policy if exists "site_images_admin_delete" on storage.objects;
create policy "site_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'site-images' and private.has_role(auth.uid(), 'admin'));

-- =====================================================================
-- 6. SEED kategori awal
-- =====================================================================
insert into public.categories (name, slug, description) values
  ('Tampah Premium', 'tampah-premium', 'Aneka kue tampah pilihan terbaik'),
  ('Tampah Mini', 'tampah-mini', 'Cocok untuk acara kecil'),
  ('Tampah Spesial', 'tampah-spesial', 'Isi lengkap, rasa istimewa'),
  ('Tampah Keluarga', 'tampah-keluarga', 'Porsi pas untuk keluarga')
on conflict (slug) do nothing;

insert into public.homepage_hero (
  id,
  eyebrow,
  title,
  highlight_text,
  description,
  primary_button_label,
  primary_button_url,
  secondary_button_label,
  secondary_button_url,
  image_alt,
  is_active
) values (
  'home',
  'Kue Tradisional, Rasa Istimewa',
  'Kue Tampah Khas',
  'Makassar',
  'Aneka kue tradisional dibuat dengan bahan berkualitas dan cinta — siap memeriahkan momen spesial keluarga Anda.',
  'Belanja Sekarang',
  '/produk',
  'Lihat Produk',
  '/produk',
  'Aneka kue tampah khas Makassar',
  true
)
on conflict (id) do nothing;

insert into public.site_settings (id, about_image_url) values (
  'global', 
  'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=1200&q=80'
) on conflict (id) do nothing;

-- =====================================================================
-- 7. CARA MEMBUAT USER ADMIN
-- =====================================================================
-- a) Di dashboard Supabase → Authentication → Users → "Add user"
--    masukkan email & password admin Anda.
-- b) Copy UUID user yang baru dibuat, lalu jalankan:
--
--    insert into public.user_roles (user_id, role)
--    values ('PASTE-UUID-DI-SINI', 'admin');
--
-- c) Login di /login pada website.
