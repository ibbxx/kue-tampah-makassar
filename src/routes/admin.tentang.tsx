import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Loader2, Save, UploadCloud, X } from "lucide-react";
import { useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { supabase, type SiteSettings } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/tentang")({
  component: AdminTentang,
});

function AdminTentang() {
  const qc = useQueryClient();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", "global")
        .maybeSingle();
      if (error) throw error;
      return data as SiteSettings | null;
    },
  });

  useEffect(() => {
    if (data) {
      setImageUrl(data.about_image_url);
    }
  }, [data]);

  const handleUpload = async (file: File) => {
    if (!file) return;
    try {
      setUploading(true);
      let fileToUpload = file;

      if (file.size > 200 * 1024) {
        toast.info("Gambar lebih dari 200KB, mengompres otomatis...");
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 0.19,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.9,
        });
      }

      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `about-hero-${Date.now()}.${fileExt}`;
      const filePath = `hero/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("site-images")
        .upload(filePath, fileToUpload, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("site-images").getPublicUrl(filePath);

      setImageUrl(publicUrl);
      toast.success("Gambar berhasil diunggah. Klik Simpan Pengaturan.");
    } catch (error: any) {
      toast.error("Gagal mengunggah gambar: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      const payload = {
        id: "global",
        about_image_url: imageUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("site_settings").upsert(payload, { onConflict: "id" });
      
      // If table doesn't exist, we will catch it here and alert user
      if (error) {
        if (error.code === "42P01") {
          toast.error("Tabel site_settings belum ada. Jalankan add_site_settings.sql di Supabase.");
          return;
        }
        throw error;
      }

      toast.success("Pengaturan Tentang Kami tersimpan");
      qc.invalidateQueries({ queryKey: ["admin", "site-settings"] });
    } catch (error: any) {
      toast.error("Gagal menyimpan: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Halaman Tentang Kami</h1>
        <p className="text-sm text-muted-foreground">
          Kelola konten halaman Tentang Kami.
        </p>
      </div>

      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat pengaturan...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
              <ImageIcon className="h-4 w-4 text-primary" /> Gambar Utama (Hero) Tentang Kami
            </h2>

            {imageUrl && (
              <div className="relative aspect-video overflow-hidden rounded-lg border border-border group mb-4">
                <img
                  src={imageUrl}
                  alt="Preview Tentang Kami"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-sm hover:scale-110 transition-transform"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div
              className={cn(
                "mt-4 flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition",
                uploading
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/30 hover:border-primary/50",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("border-primary", "bg-primary/5");
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-primary", "bg-primary/5");
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-primary", "bg-primary/5");
                const file = e.dataTransfer.files[0];
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
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                  />
                </label>
              )}
            </div>
            
            <div className="mt-4">
               <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">URL gambar (Manual)</span>
                  <input
                    value={imageUrl ?? ""}
                    onChange={(event) => setImageUrl(event.target.value || null)}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm shadow-sm outline-none transition hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </label>
            </div>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving || uploading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Pengaturan
          </button>
        </div>
      )}
    </div>
  );
}
