import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Loader2, Save, UploadCloud, X } from "lucide-react";
import { useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { supabase, type HomepageHero } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/hero")({
  component: HeroAdmin,
});

type HeroForm = Omit<HomepageHero, "updated_at">;

const defaultHero: HeroForm = {
  id: "home",
  eyebrow: "Kue Tradisional, Rasa Istimewa",
  title: "Kue Tampah Khas",
  highlight_text: "Makassar",
  description:
    "Aneka kue tradisional dibuat dengan bahan berkualitas dan cinta — siap memeriahkan momen spesial keluarga Anda.",
  primary_button_label: "Belanja Sekarang",
  primary_button_url: "/produk",
  secondary_button_label: "Lihat Produk",
  secondary_button_url: "/produk",
  image_url: null,
  image_alt: "Aneka kue tampah khas Makassar",
  is_active: true,
};

function HeroAdmin() {
  const qc = useQueryClient();
  const [form, setForm] = useState<HeroForm>(defaultHero);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "homepage-hero"],
    queryFn: async () => {
      const { data, error } = await supabase.from("homepage_hero").select("*").eq("id", "home").maybeSingle();
      if (error) throw error;
      return data as HomepageHero | null;
    },
  });

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        eyebrow: data.eyebrow,
        title: data.title,
        highlight_text: data.highlight_text,
        description: data.description,
        primary_button_label: data.primary_button_label,
        primary_button_url: data.primary_button_url,
        secondary_button_label: data.secondary_button_label,
        secondary_button_url: data.secondary_button_url,
        image_url: data.image_url,
        image_alt: data.image_alt,
        is_active: data.is_active,
      });
    }
  }, [data]);

  const update = <K extends keyof HeroForm>(key: K, value: HeroForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleUpload = async (file: File) => {
    if (!file) return;

    try {
      setUploading(true);
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1800,
        useWebWorker: true,
      });

      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `home-hero-${Date.now()}.${fileExt}`;
      const filePath = `hero/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("site-images").upload(filePath, compressedFile, {
        upsert: true,
      });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("site-images").getPublicUrl(filePath);

      const images = form.image_url ? form.image_url.split(",").filter(Boolean) : [];
      update("image_url", [...images, publicUrl].join(","));
      toast.success("Gambar hero berhasil diunggah");
    } catch (error: any) {
      toast.error("Gagal mengunggah gambar: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const images = form.image_url ? form.image_url.split(",").filter(Boolean) : [];
    images.splice(index, 1);
    update("image_url", images.length > 0 ? images.join(",") : null);
  };

  const save = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        eyebrow: form.eyebrow.trim() || defaultHero.eyebrow,
        title: form.title.trim() || defaultHero.title,
        highlight_text: form.highlight_text.trim() || defaultHero.highlight_text,
        description: form.description.trim() || defaultHero.description,
        primary_button_label: form.primary_button_label.trim() || defaultHero.primary_button_label,
        primary_button_url: form.primary_button_url.trim() || defaultHero.primary_button_url,
        secondary_button_label: form.secondary_button_label.trim() || defaultHero.secondary_button_label,
        secondary_button_url: form.secondary_button_url.trim() || defaultHero.secondary_button_url,
        image_alt: form.image_alt.trim() || defaultHero.image_alt,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("homepage_hero").upsert(payload, { onConflict: "id" });
      if (error) throw error;

      toast.success("Hero homepage tersimpan");
      qc.invalidateQueries({ queryKey: ["admin", "homepage-hero"] });
      qc.invalidateQueries({ queryKey: ["homepage-hero"] });
    } catch (error: any) {
      toast.error("Gagal menyimpan hero: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Atur Hero</h1>
        <p className="text-sm text-muted-foreground">Kelola teks, tombol, dan gambar utama halaman beranda.</p>
      </div>

      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat hero...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
            <div className="space-y-5">
              <Field
                label="Teks kecil di atas judul"
                value={form.eyebrow}
                onChange={(value) => update("eyebrow", value)}
                placeholder="Kue Tradisional, Rasa Istimewa"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Judul utama"
                  value={form.title}
                  onChange={(value) => update("title", value)}
                  placeholder="Kue Tampah Khas"
                />
                <Field
                  label="Teks yang disorot"
                  value={form.highlight_text}
                  onChange={(value) => update("highlight_text", value)}
                  placeholder="Makassar"
                />
              </div>
              <Field
                label="Deskripsi"
                value={form.description}
                onChange={(value) => update("description", value)}
                textarea
                placeholder="Tulis deskripsi singkat untuk hero homepage..."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Label tombol utama"
                  value={form.primary_button_label}
                  onChange={(value) => update("primary_button_label", value)}
                />
                <Field
                  label="Link tombol utama"
                  value={form.primary_button_url}
                  onChange={(value) => update("primary_button_url", value)}
                  placeholder="/produk"
                />
                <Field
                  label="Label tombol kedua"
                  value={form.secondary_button_label}
                  onChange={(value) => update("secondary_button_label", value)}
                />
                <Field
                  label="Link tombol kedua"
                  value={form.secondary_button_url}
                  onChange={(value) => update("secondary_button_url", value)}
                  placeholder="/produk"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  checked={form.is_active}
                  onChange={(event) => update("is_active", event.target.checked)}
                />
                <span>
                  <span className="block text-sm font-semibold text-foreground">Tampilkan hero custom</span>
                  <span className="block text-xs text-muted-foreground">Jika dimatikan, homepage memakai fallback bawaan.</span>
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground justify-between">
                <span className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /> Gambar Hero</span>
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Bisa lebih dari 1</span>
              </h2>
              
              {/* Daftar Gambar (Grid) */}
              {(form.image_url ? form.image_url.split(",").filter(Boolean) : []).length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {(form.image_url ? form.image_url.split(",").filter(Boolean) : []).map((url, i) => (
                    <div key={i} className="group relative aspect-video overflow-hidden rounded-lg border border-border">
                      <img src={url} alt={`Preview ${i+1}`} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <button type="button" onClick={() => removeImage(i)} className="rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-sm hover:scale-110 transition-transform">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div
                className={cn(
                  "mt-4 flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition",
                  uploading ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-primary/50",
                )}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.currentTarget.classList.add("border-primary", "bg-primary/5");
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  event.currentTarget.classList.remove("border-primary", "bg-primary/5");
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.currentTarget.classList.remove("border-primary", "bg-primary/5");
                  const file = event.dataTransfer.files[0];
                  if (file) handleUpload(file);
                }}
              >
                {uploading ? (
                  <div className="flex h-full flex-col items-center justify-center text-primary">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="mt-2 text-[10px] font-medium">Mengunggah...</span>
                  </div>
                ) : (
                  <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center px-6 text-center text-muted-foreground transition hover:text-primary">
                    <UploadCloud className="mb-2 h-8 w-8 opacity-60" />
                    <span className="text-sm font-medium">Klik atau drag gambar</span>
                    <span className="mt-1 text-[11px]">PNG, JPG, atau WebP</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(event) => event.target.files?.[0] && handleUpload(event.target.files[0])}
                    />
                  </label>
                )}
              </div>

              <div className="mt-4 space-y-4">
                <Field
                  label="URL gambar"
                  value={form.image_url ?? ""}
                  onChange={(value) => update("image_url", value || null)}
                  placeholder="https://..."
                />
                <Field
                  label="Alt text gambar"
                  value={form.image_alt}
                  onChange={(value) => update("image_alt", value)}
                  placeholder="Aneka kue tampah khas Makassar"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={save}
              disabled={saving || uploading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Hero
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm shadow-sm outline-none transition hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm shadow-sm outline-none transition hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary"
        />
      )}
    </label>
  );
}
