import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] VITE_SUPABASE_URL atau VITE_SUPABASE_PUBLISHABLE_KEY belum diisi. Buat file .env (lihat .env.example) dan jalankan supabase/schema.sql.",
  );
}

export const supabase = createClient(url ?? "https://placeholder.supabase.co", key ?? "placeholder", {
  auth: { persistSession: true, autoRefreshToken: true },
});

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  category_id: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  badge: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url?: string | null;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  published: boolean;
  created_at: string;
};

export type HomepageHero = {
  id: string;
  eyebrow: string;
  title: string;
  highlight_text: string;
  description: string;
  primary_button_label: string;
  primary_button_url: string;
  secondary_button_label: string;
  secondary_button_url: string;
  image_url: string | null;
  image_alt: string;
  is_active: boolean;
  updated_at: string;
};

export type Order = {
  id: string;
  customer_name: string;
  phone: string;
  address: string | null;
  notes: string | null;
  total: number;
  status: string;
  created_at: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

export const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
