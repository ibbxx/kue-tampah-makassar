-- =====================================================================
-- KUE TAMPAH — Migration: Full Checkout (tanpa WhatsApp)
-- Jalankan di Supabase SQL Editor setelah schema.sql
-- =====================================================================

-- 1. Kolom baru di tabel orders
-- =====================================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'transfer',
  ADD COLUMN IF NOT EXISTS payment_proof_url text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS order_number text;

-- Unique index untuk order_number (agar bisa lookup)
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_idx ON public.orders (order_number);

-- 2. Function untuk generate order number (KT-YYYYMMDD-XXXX)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Trigger auto-generate order_number saat INSERT
DROP TRIGGER IF EXISTS trg_generate_order_number ON public.orders;
CREATE TRIGGER trg_generate_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION public.generate_order_number();

-- 3. Tabel payment_methods (dikelola admin)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'bank_transfer',  -- 'bank_transfer', 'cod', 'ewallet'
  account_number text,
  account_name text,
  bank_name text,
  icon_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  instructions text,
  created_at timestamptz DEFAULT now()
);

-- RLS untuk payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_methods_select_active" ON public.payment_methods;
CREATE POLICY "payment_methods_select_active" ON public.payment_methods
  FOR SELECT USING (is_active OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "payment_methods_admin_all" ON public.payment_methods
;
CREATE POLICY "payment_methods_admin_all" ON public.payment_methods
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. RLS: Allow customers to view their own order by order_number + phone
-- =====================================================================
DROP POLICY IF EXISTS "orders_customer_lookup" ON public.orders;
CREATE POLICY "orders_customer_lookup" ON public.orders
  FOR SELECT
  USING (true);  -- Customers can view by order_number (filtered in app)

-- Allow anon update for uploading payment proof
DROP POLICY IF EXISTS "orders_customer_upload_proof" ON public.orders;
CREATE POLICY "orders_customer_upload_proof" ON public.orders
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 5. Storage bucket for payment proofs
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Public can upload payment proofs
DROP POLICY IF EXISTS "payment_proofs_public_insert" ON storage.objects;
CREATE POLICY "payment_proofs_public_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');

-- Public can read payment proofs
DROP POLICY IF EXISTS "payment_proofs_public_read" ON storage.objects;
CREATE POLICY "payment_proofs_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-proofs');

-- Admin can delete payment proofs
DROP POLICY IF EXISTS "payment_proofs_admin_delete" ON storage.objects;
CREATE POLICY "payment_proofs_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));

-- 6. Seed default payment methods (bisa diubah admin)
-- =====================================================================
INSERT INTO public.payment_methods (name, type, bank_name, account_number, account_name, is_active, sort_order, instructions) VALUES
  ('Transfer BCA', 'bank_transfer', 'BCA', '1234567890', 'Kue Tampah Ratulangi', true, 1, 'Transfer ke rekening BCA di atas, lalu upload bukti transfer.'),
  ('Transfer BRI', 'bank_transfer', 'BRI', '0987654321', 'Kue Tampah Ratulangi', true, 2, 'Transfer ke rekening BRI di atas, lalu upload bukti transfer.'),
  ('Transfer Mandiri', 'bank_transfer', 'Mandiri', '1122334455', 'Kue Tampah Ratulangi', true, 3, 'Transfer ke rekening Mandiri di atas, lalu upload bukti transfer.'),
  ('Bayar di Tempat (COD)', 'cod', NULL, NULL, NULL, true, 10, 'Bayar langsung saat pesanan diantar atau diambil di toko.')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- SELESAI! Jalankan migration ini di Supabase SQL Editor.
-- Pastikan schema.sql sudah dijalankan terlebih dahulu.
-- =====================================================================
