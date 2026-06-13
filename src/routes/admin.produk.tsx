import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Package, Boxes, FolderTree } from "lucide-react";
import { useState } from "react";
import { supabase, type Product, type Category, formatRupiah } from "@/lib/supabase";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/produk")({
  component: ProductAdmin,
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function ProductAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: products } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as Product[];
    },
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => ((await supabase.from("categories").select("*")).data as Category[]) ?? [],
  });

  const save = async () => {
    if (!editing) return;
    const payload = {
      name: editing.name ?? "",
      slug: editing.slug || slugify(editing.name ?? ""),
      description: editing.description ?? null,
      price: Number(editing.price ?? 0),
      stock: Number(editing.stock ?? 0),
      category_id: editing.category_id || null,
      image_url: editing.image_url ?? null,
      is_featured: !!editing.is_featured,
      is_active: editing.is_active ?? true,
      badge: editing.badge ?? null,
    };
    const { error } = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Produk tersimpan");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus produk ini?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Dihapus");
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
  };

  const handleUpload = async (file: File) => {
    if (!file || !editing) return;

    try {
      setUploading(true);

      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      const images = editing.image_url ? editing.image_url.split(",").filter(Boolean) : [];
      setEditing({ ...editing, image_url: [...images, publicUrl].join(",") });
      toast.success("Gambar berhasil diunggah");
    } catch (error: any) {
      toast.error("Gagal mengunggah: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    if (!editing) return;
    const images = editing.image_url ? editing.image_url.split(",").filter(Boolean) : [];
    images.splice(index, 1);
    setEditing({ ...editing, image_url: images.length > 0 ? images.join(",") : null });
  };

  const handleCategoryUpload = async (file: File) => {
    if (!file || !editingCategory) return;

    try {
      setUploading(true);

      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      const fileExt = file.name.split(".").pop();
      const fileName = `category-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      setEditingCategory({ ...editingCategory, image_url: publicUrl });
      toast.success("Gambar kategori berhasil diunggah");
    } catch (error: any) {
      toast.error("Gagal mengunggah: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const saveCategory = async () => {
    if (!editingCategory) return;
    const payload = {
      name: editingCategory.name ?? "",
      slug: editingCategory.slug || slugify(editingCategory.name ?? ""),
      description: editingCategory.description ?? null,
      image_url: editingCategory.image_url ?? null,
    };
    const { error } = editingCategory.id
      ? await supabase.from("categories").update(payload).eq("id", editingCategory.id)
      : await supabase.from("categories").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Kategori tersimpan");
    setEditingCategory(null);
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const removeCategory = async (id: string) => {
    if (!confirm("Hapus kategori ini? Semua produk di dalamnya akan menjadi tanpa kategori."))
      return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Kategori dihapus");
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Atur Produk</h1>
          <p className="text-sm text-muted-foreground">Kelola katalog kue tampah Anda.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategories(true)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <FolderTree className="h-4 w-4" /> Kelola Kategori
          </button>
          <button
            onClick={() => setEditing({ is_active: true, stock: 0, price: 0 })}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Tambah Produk
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Harga</th>
              <th className="px-4 py-3">Stok</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(products ?? []).map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">/{p.slug}</div>
                </td>
                <td className="px-4 py-3">{formatRupiah(Number(p.price))}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">
                  {p.is_active ? (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                      Aktif
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Nonaktif</span>
                  )}
                  {p.is_featured && (
                    <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      Unggulan
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditing(p)}
                    className="mr-1 rounded-md p-1.5 hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Belum ada produk.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setEditing(null)}
          />
          <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col rounded-2xl bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <h2 className="font-display text-2xl font-bold">
                  {editing.id ? "Edit Produk" : "Tambah Produk Baru"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Isi informasi produk dengan lengkap untuk ditampilkan di etalase toko.
                </p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="rounded-full p-2 hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-8 md:grid-cols-3">
                {/* Left Column: Image Preview & Visibility */}
                <div className="space-y-6 md:col-span-1">
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center justify-between">
                      Media Produk
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Bisa lebih dari 1
                      </span>
                    </h3>

                    {/* Daftar Gambar (Grid) */}
                    {(editing.image_url ? editing.image_url.split(",").filter(Boolean) : [])
                      .length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {(editing.image_url
                          ? editing.image_url.split(",").filter(Boolean)
                          : []
                        ).map((url, i) => (
                          <div
                            key={i}
                            className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                          >
                            <img
                              src={url}
                              alt={`Preview ${i + 1}`}
                              className="h-full w-full object-cover transition-transform group-hover:scale-110"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => removeImage(i)}
                                className="rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-sm hover:scale-110 transition-transform"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tombol Upload */}
                    <div
                      className={cn(
                        "group relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all",
                        uploading
                          ? "border-primary bg-primary/5"
                          : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
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
                        <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary p-4">
                          <UploadCloud className="mb-2 h-8 w-8 opacity-50" />
                          <span className="text-sm font-medium">Klik atau Drag & Drop</span>
                          <span className="mt-1 text-[10px] text-center">
                            PNG, JPG up to 10MB (Auto Compress)
                          </span>
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
                      <Field
                        label="URL Gambar (Pisahkan dengan koma jika lebih dari 1)"
                        value={editing.image_url ?? ""}
                        onChange={(v) => setEditing({ ...editing, image_url: v })}
                        placeholder="https://url1.jpg,https://url2.jpg"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">
                      Pengaturan Visibilitas
                    </h3>
                    <div className="space-y-4">
                      <label className="flex cursor-pointer items-start gap-3">
                        <div className="flex h-5 items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            checked={!!editing.is_active}
                            onChange={(e) =>
                              setEditing({ ...editing, is_active: e.target.checked })
                            }
                          />
                        </div>
                        <div>
                          <span className="block text-sm font-medium text-foreground">
                            Tampil di Toko
                          </span>
                          <span className="block text-xs text-muted-foreground mt-0.5">
                            Produk dapat dibeli oleh pelanggan
                          </span>
                        </div>
                      </label>
                      <label className="flex cursor-pointer items-start gap-3">
                        <div className="flex h-5 items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            checked={!!editing.is_featured}
                            onChange={(e) =>
                              setEditing({ ...editing, is_featured: e.target.checked })
                            }
                          />
                        </div>
                        <div>
                          <span className="block text-sm font-medium text-foreground">
                            Produk Unggulan
                          </span>
                          <span className="block text-xs text-muted-foreground mt-0.5">
                            Tampil lebih awal di halaman utama
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right Column: Details */}
                <div className="space-y-8 md:col-span-2">
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" /> Informasi Dasar
                    </h3>
                    <Field
                      label="Nama Produk"
                      value={editing.name ?? ""}
                      onChange={(v) =>
                        setEditing({ ...editing, name: v, slug: editing.slug || slugify(v) })
                      }
                      placeholder="Contoh: Tampah Spesial 50 Pcs"
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Slug (URL Otomatis)"
                        value={editing.slug ?? ""}
                        onChange={(v) => setEditing({ ...editing, slug: v })}
                        placeholder="tampah-spesial"
                      />
                      <Field
                        label="Badge Label (Opsional)"
                        value={editing.badge ?? ""}
                        onChange={(v) => setEditing({ ...editing, badge: v })}
                        placeholder="Contoh: Best Seller, Baru"
                      />
                    </div>

                    <Field
                      label="Deskripsi Lengkap"
                      value={editing.description ?? ""}
                      onChange={(v) => setEditing({ ...editing, description: v })}
                      textarea
                      placeholder="Jelaskan isi detail, keunggulan, dan ukuran produk ini..."
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Boxes className="h-4 w-4 text-primary" /> Harga & Organisasi
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Harga Satuan (Rp)"
                        type="number"
                        value={String(editing.price ?? 0)}
                        onChange={(v) => setEditing({ ...editing, price: Number(v) })}
                      />
                      <Field
                        label="Stok Tersedia"
                        type="number"
                        value={String(editing.stock ?? 0)}
                        onChange={(v) => setEditing({ ...editing, stock: Number(v) })}
                      />
                    </div>

                    <label className="block">
                      <span className="text-xs font-medium text-muted-foreground mb-1 block">
                        Kategori Produk
                      </span>
                      <select
                        value={editing.category_id ?? ""}
                        onChange={(e) =>
                          setEditing({ ...editing, category_id: e.target.value || null })
                        }
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-all hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                      >
                        <option value="">— Tidak ada kategori —</option>
                        {(categories ?? []).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => setEditing(null)}
                className="rounded-full px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Batal
              </button>
              <button
                onClick={save}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 transition-opacity"
              >
                {editing.id ? "Simpan Perubahan" : "Simpan Produk Baru"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KATEGORI */}
      {showCategories && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setShowCategories(false)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <h2 className="font-display text-xl font-bold">Kelola Kategori</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Kelompokkan produk Anda agar mudah dicari oleh pelanggan.
                </p>
              </div>
              <button
                onClick={() => setShowCategories(false)}
                className="rounded-full p-2 hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {!editingCategory ? (
                <>
                  <div className="mb-4 flex justify-end">
                    <button
                      onClick={() => setEditingCategory({})}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Tambah Kategori
                    </button>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">Nama Kategori</th>
                          <th className="px-4 py-3">Slug</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(categories ?? []).map((c) => (
                          <tr key={c.id}>
                            <td className="px-4 py-3 font-medium">{c.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">/{c.slug}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setEditingCategory(c)}
                                className="mr-1 rounded-md p-1.5 hover:bg-muted transition-colors"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => removeCategory(c.id)}
                                className="rounded-md p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {(!categories || categories.length === 0) && (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                              Belum ada kategori.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-border p-5 bg-card shadow-sm animate-in fade-in zoom-in-95 duration-200">
                  <h3 className="mb-4 text-sm font-semibold">
                    {editingCategory.id ? "Edit Kategori" : "Tambah Kategori Baru"}
                  </h3>
                  <div className="space-y-4">
                    <Field
                      label="Nama Kategori"
                      value={editingCategory.name ?? ""}
                      onChange={(v) =>
                        setEditingCategory({
                          ...editingCategory,
                          name: v,
                          slug: editingCategory.slug || slugify(v),
                        })
                      }
                      placeholder="Contoh: Tampah Premium"
                    />
                    <Field
                      label="Slug (URL Otomatis)"
                      value={editingCategory.slug ?? ""}
                      onChange={(v) => setEditingCategory({ ...editingCategory, slug: v })}
                      placeholder="tampah-premium"
                    />
                    <Field
                      label="Deskripsi Singkat"
                      value={editingCategory.description ?? ""}
                      onChange={(v) => setEditingCategory({ ...editingCategory, description: v })}
                      textarea
                      placeholder="Aneka tampah ukuran besar..."
                    />

                    <div>
                      <span className="text-xs font-medium text-muted-foreground mb-1 block">
                        Gambar Kategori (Opsional)
                      </span>
                      <div className="flex items-center gap-4">
                        {editingCategory.image_url && (
                          <img
                            src={editingCategory.image_url}
                            alt="Kategori"
                            className="h-16 w-16 object-cover rounded-md border border-border"
                          />
                        )}
                        <label className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UploadCloud className="h-4 w-4" />
                          )}
                          {uploading ? "Mengunggah..." : "Pilih Gambar"}
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) =>
                              e.target.files?.[0] && handleCategoryUpload(e.target.files[0])
                            }
                            disabled={uploading}
                          />
                        </label>
                      </div>
                      <div className="mt-2">
                        <Field
                          label="Atau URL Gambar"
                          value={editingCategory.image_url ?? ""}
                          onChange={(v) => setEditingCategory({ ...editingCategory, image_url: v })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-muted transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        onClick={saveCategory}
                        className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 transition-opacity"
                      >
                        Simpan Kategori
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
  type = "text",
  textarea,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-all hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-all hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
        />
      )}
    </label>
  );
}
