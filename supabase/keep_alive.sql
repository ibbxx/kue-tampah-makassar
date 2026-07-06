-- ============================================================
-- Supabase Keep-Alive Function
-- ============================================================
-- Fungsi ini digunakan untuk mencegah database Supabase Free Tier
-- masuk ke mode "paused" (nonaktif) karena tidak ada aktivitas
-- selama 7 hari berturut-turut.
--
-- Cara penggunaan:
--   Jalankan query ini di Supabase Dashboard > SQL Editor
--   Fungsi ini kemudian akan dipanggil secara terjadwal dari luar
--   (misalnya melalui GitHub Actions) via REST API endpoint:
--
--   POST https://<PROJECT_ID>.supabase.co/rest/v1/rpc/ping_db
-- ============================================================

create or replace function ping_db()
returns json
language plpgsql
set search_path = public
as $$
begin
  return json_build_object(
    'status', 'ok',
    'timestamp', now()
  );
end;
$$;
