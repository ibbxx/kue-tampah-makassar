-- =====================================================================
-- SUPABASE SECURITY PATCH / CONSOLIDATED FIXES (REVISED V3)
-- =====================================================================
-- Jalankan query ini di Supabase Dashboard > SQL Editor untuk memperbaiki
-- semua celah keamanan yang terdeteksi (WARN / SECURITY).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CLEANUP & SCHEMA SEPARATION (private.has_role)
-- ---------------------------------------------------------------------

-- Buat skema private jika belum ada (skema internal, tidak terekspos REST API)
CREATE SCHEMA IF NOT EXISTS private;

-- Hapus fungsi has_role lama dari skema public secara CASCADE.
-- CASCADE akan otomatis mendrop kebijakan RLS lama yang bergantung padanya,
-- yang kemudian akan kita buat ulang dengan benar di bawah.
DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;

-- Buat fungsi has_role di skema private dengan mode SECURITY DEFINER
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Berikan hak akses usage skema dan execute fungsi agar RLS bisa mengevaluasi
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated, service_role;


-- ---------------------------------------------------------------------
-- 2. SECURE PUBLIC DB FUNCTIONS (Switch to SECURITY INVOKER)
-- ---------------------------------------------------------------------

-- A. Amankan ping_db (Ubah ke SECURITY INVOKER agar tidak memiliki hak superuser)
CREATE OR REPLACE FUNCTION public.ping_db()
RETURNS json
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object(
    'status', 'ok',
    'timestamp', now()
  );
END;
$$;

-- B. Amankan generate_order_number (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  today_str text;
  seq int;
BEGIN
  today_str := to_char(now(), 'YYYYMMDD');
  SELECT count(*) + 1 INTO seq
    FROM public.orders
    WHERE order_number LIKE 'KT-' || today_str || '-%';
  NEW.order_number := 'KT-' || today_str || '-' || lpad(seq::text, 4, '0');
  RETURN NEW;
END;
$$;


-- ---------------------------------------------------------------------
-- 3. SECURE RLS POLICIES FOR TABLES (Using private.has_role)
-- ---------------------------------------------------------------------

-- A. Categories
DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all" ON public.categories FOR all
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- B. Products
DROP POLICY IF EXISTS "products_select_active" ON public.products;
CREATE POLICY "products_select_active" ON public.products 
  FOR SELECT USING (is_active OR (auth.uid() IS NOT NULL AND private.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all" ON public.products FOR all
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- C. Articles
DROP POLICY IF EXISTS "articles_select_published" ON public.articles;
CREATE POLICY "articles_select_published" ON public.articles 
  FOR SELECT USING (published OR (auth.uid() IS NOT NULL AND private.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "articles_admin_all" ON public.articles;
CREATE POLICY "articles_admin_all" ON public.articles FOR all
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- D. Orders (INSERT & SELECT)
DROP POLICY IF EXISTS "orders_insert_any" ON public.orders;
CREATE POLICY "orders_insert_any" ON public.orders 
  FOR INSERT WITH CHECK (
    customer_name IS NOT NULL AND length(trim(customer_name)) > 0 AND
    phone IS NOT NULL AND length(trim(phone)) > 0
  );

DROP POLICY IF EXISTS "orders_admin_select" ON public.orders;
CREATE POLICY "orders_admin_select" ON public.orders 
  FOR SELECT USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
CREATE POLICY "orders_admin_update" ON public.orders 
  FOR UPDATE USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "orders_admin_delete" ON public.orders;
CREATE POLICY "orders_admin_delete" ON public.orders 
  FOR DELETE USING (private.has_role(auth.uid(), 'admin'));

-- E. Order Items
DROP POLICY IF EXISTS "order_items_insert_any" ON public.order_items;
CREATE POLICY "order_items_insert_any" ON public.order_items 
  FOR INSERT WITH CHECK (
    qty > 0 AND price >= 0
  );

DROP POLICY IF EXISTS "order_items_admin_select" ON public.order_items;
CREATE POLICY "order_items_admin_select" ON public.order_items 
  FOR SELECT USING (private.has_role(auth.uid(), 'admin'));

-- F. Contact Messages
DROP POLICY IF EXISTS "contact_insert_any" ON public.contact_messages;
CREATE POLICY "contact_insert_any" ON public.contact_messages 
  FOR INSERT WITH CHECK (
    name IS NOT NULL AND length(trim(name)) > 0 AND
    message IS NOT NULL AND length(trim(message)) > 0
  );

DROP POLICY IF EXISTS "contact_admin_all" ON public.contact_messages;
CREATE POLICY "contact_admin_all" ON public.contact_messages FOR all
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- G. Homepage Hero
DROP POLICY IF EXISTS "homepage_hero_select_active" ON public.homepage_hero;
CREATE POLICY "homepage_hero_select_active" ON public.homepage_hero 
  FOR SELECT USING (is_active OR (auth.uid() IS NOT NULL AND private.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "homepage_hero_admin_all" ON public.homepage_hero;
CREATE POLICY "homepage_hero_admin_all" ON public.homepage_hero FOR all
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- H. User Roles
DROP POLICY IF EXISTS "user_roles_self_read" ON public.user_roles;
CREATE POLICY "user_roles_self_read" ON public.user_roles 
  FOR SELECT USING (auth.uid() = user_id OR (auth.uid() IS NOT NULL AND private.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR all
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- I. Payment Methods
DROP POLICY IF EXISTS "payment_methods_select_active" ON public.payment_methods;
CREATE POLICY "payment_methods_select_active" ON public.payment_methods
  FOR SELECT USING (is_active OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "payment_methods_admin_all" ON public.payment_methods;
CREATE POLICY "payment_methods_admin_all" ON public.payment_methods
  FOR ALL
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));


-- ---------------------------------------------------------------------
-- 4. SECURE UPDATE ORDERS (Trigger & RLS)
-- ---------------------------------------------------------------------

-- A. UPDATE Policy
DROP POLICY IF EXISTS "orders_customer_upload_proof" ON public.orders;
CREATE POLICY "orders_customer_upload_proof" ON public.orders
  FOR UPDATE
  USING (status = 'pending')
  WITH CHECK (status = 'pending');

-- B. Trigger check_order_update (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.check_order_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Jika yang melakukan update adalah admin, izinkan semuanya
  IF auth.uid() IS NOT NULL AND private.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Pembeli biasa hanya boleh mengubah order berstatus pending
  IF OLD.status <> 'pending' THEN
    RAISE EXCEPTION 'Hanya pesanan pending yang bisa diperbarui.';
  END IF;

  -- Lindungi seluruh kolom agar tidak bisa dimanipulasi selain payment_proof_url
  IF NEW.customer_name <> OLD.customer_name OR
     NEW.phone <> OLD.phone OR
     NEW.address IS DISTINCT FROM OLD.address OR
     NEW.notes IS DISTINCT FROM OLD.notes OR
     NEW.total <> OLD.total OR
     NEW.status <> OLD.status OR
     NEW.email IS DISTINCT FROM OLD.email OR
     NEW.order_number IS DISTINCT FROM OLD.order_number THEN
    RAISE EXCEPTION 'Update tidak sah! Anda hanya diperbolehkan mengunggah bukti transfer (payment_proof_url).';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_order_update ON public.orders;
CREATE TRIGGER trg_check_order_update
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.check_order_update();


-- ---------------------------------------------------------------------
-- 5. SECURE STORAGE BUCKETS & THEIR ADMIN POLICIES
-- ---------------------------------------------------------------------

-- A. product-images
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images' AND (auth.uid() IS NOT NULL AND private.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "product_images_admin_write" ON storage.objects;
CREATE POLICY "product_images_admin_write" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "product_images_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND private.has_role(auth.uid(), 'admin'));

-- B. site-images
DROP POLICY IF EXISTS "site_images_public_read" ON storage.objects;
CREATE POLICY "site_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-images' AND (auth.uid() IS NOT NULL AND private.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "site_images_admin_write" ON storage.objects;
CREATE POLICY "site_images_admin_write" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'site-images' AND private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "site_images_admin_update" ON storage.objects;
CREATE POLICY "site_images_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'site-images' AND private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "site_images_admin_delete" ON storage.objects;
CREATE POLICY "site_images_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'site-images' AND private.has_role(auth.uid(), 'admin'));

-- C. payment-proofs
DROP POLICY IF EXISTS "payment_proofs_public_read" ON storage.objects;
CREATE POLICY "payment_proofs_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-proofs' AND (auth.uid() IS NOT NULL AND private.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "payment_proofs_admin_delete" ON storage.objects;
CREATE POLICY "payment_proofs_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'payment-proofs' AND private.has_role(auth.uid(), 'admin'));

-- =====================================================================
-- PERBAIKAN SELESAI
-- =====================================================================
