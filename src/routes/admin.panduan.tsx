import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/panduan")({ component: GuidePage });

const sections = [
  {
    title: "1. Setup awal Supabase",
    body: [
      "Buka project Supabase Anda → SQL Editor → tempel isi file supabase/schema.sql lalu jalankan.",
      "File ini membuat semua tabel, RLS, role admin, dan storage bucket sekaligus.",
      "Salin .env.example menjadi .env, isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY.",
    ],
  },
  {
    title: "2. Membuat akun admin",
    body: [
      "Supabase Dashboard → Authentication → Users → Add user (email + password).",
      "Salin UUID user, lalu jalankan di SQL Editor: insert into public.user_roles (user_id, role) values ('UUID', 'admin');",
      "Login di /login dengan email & password tersebut.",
    ],
  },
  {
    title: "3. Mengelola Hero Beranda",
    body: [
      "Buka menu 'Atur Hero' untuk mengubah teks kecil, judul, deskripsi, tombol, dan gambar utama beranda.",
      "Upload gambar langsung dari form hero; file akan disimpan ke bucket 'site-images'.",
      "Jika hero custom dimatikan, beranda tetap memakai konten fallback bawaan.",
    ],
  },
  {
    title: "4. Mengelola Produk",
    body: [
      "Buka menu 'Atur Produk' → klik Tambah untuk membuat produk baru.",
      "Isi nama, harga, stok, kategori, badge (Best Seller / Baru), dan URL gambar.",
      "Centang 'Tampil di toko' agar muncul di katalog publik. Centang 'Produk unggulan' agar muncul di Beranda.",
    ],
  },
  {
    title: "5. Mengelola Stok",
    body: [
      "Menu 'Atur Stok' menampilkan semua produk dengan input stok yang bisa diubah cepat.",
      "Setelah mengubah angka, klik tombol Simpan di baris yang sama untuk update.",
    ],
  },
  {
    title: "6. Mengelola Kategori",
    body: [
      "Buat kategori (misal: Tampah Premium, Tampah Mini) untuk memudahkan filter pelanggan.",
      "Slug otomatis terbuat dari nama; bisa diedit manual.",
    ],
  },
  {
    title: "7. Mengelola Artikel",
    body: [
      "Tulis artikel di menu 'Atur Artikel'. Centang 'Publikasikan' agar tampil di /artikel.",
      "Konten mendukung paragraf biasa; gunakan baris kosong untuk pemisah paragraf.",
    ],
  },
  {
    title: "8. Order Masuk",
    body: [
      "Setiap checkout dari pelanggan akan tersimpan di sini dengan status 'pending'.",
      "Update status pesanan: pending → diproses → selesai (atau batal).",
      "Pelanggan juga otomatis diarahkan ke WhatsApp toko untuk konfirmasi.",
    ],
  },
  {
    title: "9. Pesan Kontak",
    body: ["Inbox dari form kontak. Tandai sudah dibaca atau hapus jika tidak relevan."],
  },
  {
    title: "10. Upload gambar",
    body: [
      "Bucket 'product-images' sudah dibuat (public read, admin write).",
      "Bucket 'site-images' dipakai untuk gambar hero dan konten website lain.",
      "Upload produk dan hero bisa dilakukan langsung dari dashboard admin.",
    ],
  },
];

function GuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Panduan Admin</h1>
        <p className="text-sm text-muted-foreground">Cara menggunakan dashboard Kue Tampah.</p>
      </div>
      <div className="space-y-4">
        {sections.map((s) => (
          <div key={s.title} className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold text-primary">{s.title}</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-foreground/80">
              {s.body.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
