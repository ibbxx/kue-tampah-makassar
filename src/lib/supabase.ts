import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] VITE_SUPABASE_URL atau VITE_SUPABASE_PUBLISHABLE_KEY belum diisi. Buat file .env (lihat .env.example) dan jalankan supabase/schema.sql.",
  );
}

export const supabase = createClient(
  url ?? "https://placeholder.supabase.co",
  key ?? "placeholder",
  {
    auth: { persistSession: true, autoRefreshToken: true },
  },
);

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
  order_number: string | null;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  total: number;
  status: string;
  payment_method: string;
  payment_proof_url: string | null;
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

export type PaymentMethod = {
  id: string;
  name: string;
  type: "bank_transfer" | "cod" | "ewallet";
  account_number: string | null;
  account_name: string | null;
  bank_name: string | null;
  icon_url: string | null;
  is_active: boolean;
  sort_order: number;
  instructions: string | null;
  created_at: string;
};

export const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

/** Upload file to a Supabase storage bucket, returns public URL */
export async function uploadToStorage(
  bucket: string,
  path: string,
  file: File,
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Delete a file from Supabase storage using its public URL */
export async function deleteFromStorage(publicUrl: string): Promise<void> {
  try {
    if (!publicUrl) return;

    // Example: https://xxxx.supabase.co/storage/v1/object/public/site-images/article-123.jpg
    const marker = "/storage/v1/object/public/";
    const index = publicUrl.indexOf(marker);
    if (index === -1) return; // Not a standard Supabase storage public URL

    const pathAndBucket = publicUrl.substring(index + marker.length);
    const firstSlash = pathAndBucket.indexOf("/");
    if (firstSlash === -1) return;

    const bucket = pathAndBucket.substring(0, firstSlash);
    const filePath = decodeURIComponent(pathAndBucket.substring(firstSlash + 1));

    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) {
      console.error(`Gagal menghapus file dari storage (${bucket}/${filePath}):`, error.message);
    }
  } catch (err) {
    console.error("Gagal dalam deleteFromStorage:", err);
  }
}
