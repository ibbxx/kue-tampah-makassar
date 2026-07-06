import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Package, Boxes, FolderTree, Search } from "lucide-react";
import { useState } from "react";
import { supabase, deleteFromStorage, formatRupiah, type Product, type Category } from "@/lib/supabase";
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
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [sessionUploads, setSessionUploads] = useState<string[]>([]);
  const [sessionCategoryUploads, setSessionCategoryUploads] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const filteredProducts = (products ?? []).filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.slug && p.slug.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !categoryFilter || p.category_id === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
                          (statusFilter === "active" && p.is_active) || 
                          (statusFilter === "inactive" && !p.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
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

    if (editing.id) {
      const oldProduct = products?.find((p) => p.id === editing.id);
      const oldUrls = oldProduct?.image_url ? oldProduct.image_url.split(",").filter(Boolean) : [];
      const newUrls = payload.image_url ? payload.image_url.split(",").filter(Boolean) : [];
      const deletedUrls = oldUrls.filter((url) => !newUrls.includes(url));
      for (const url of deletedUrls) {
        await deleteFromStorage(url);
      }
    }

    const savedUrls = payload.image_url ? payload.image_url.split(",").filter(Boolean) : [];
    const uploadsToDelete = sessionUploads.filter((url) => !savedUrls.includes(url));
    for (const url of uploadsToDelete) {
      await deleteFromStorage(url);
    }
    setSessionUploads([]);

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
    const product = products?.find((p) => p.id === id);
    if (product?.image_url) {
      const urls = product.image_url.split(",").filter(Boolean);
      for (const url of urls) {
        await deleteFromStorage(url);
      }
    }
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Dihapus");
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
  };

  const handleCancel = async () => {
    for (const url of sessionUploads) {
      await deleteFromStorage(url);
    }
    setSessionUploads([]);
    setEditing(null);
  };

  const handleUpload = async (file: File) => {
    if (!file || !editing) return;

    try {
      setUploading(true);
      let fileToUpload = file;

      if (file.size > 200 * 1024) {
        toast.info("Gambar lebih dari 200KB, mengompres otomatis...");
        const options = {
          maxSizeMB: 0.19,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.9,
        };
        fileToUpload = await imageCompression(file, options);
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      const images = editing.image_url ? editing.image_url.split(",").filter(Boolean) : [];
      setEditing({ ...editing, image_url: [...images, publicUrl].join(",") });
      setSessionUploads((prev) => [...prev, publicUrl]);
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
      let fileToUpload = file;

      if (file.size > 200 * 1024) {
        toast.info("Gambar lebih dari 200KB, mengompres otomatis...");
        const options = {
          maxSizeMB: 0.19,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.9,
        };
        fileToUpload = await imageCompression(file, options);
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `category-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      setEditingCategory({ ...editingCategory, image_url: publicUrl });
      setSessionCategoryUploads((prev) => [...prev, publicUrl]);
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

    if (editingCategory.id) {
      const oldCategory = categories?.find((c) => c.id === editingCategory.id);
      if (oldCategory && oldCategory.image_url && oldCategory.image_url !== payload.image_url) {
        await deleteFromStorage(oldCategory.image_url);
      }
    }

    const uploadsToDelete = sessionCategoryUploads.filter((url) => url !== payload.image_url);
    for (const url of uploadsToDelete) {
      await deleteFromStorage(url);
    }
    setSessionCategoryUploads([]);

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
    const category = categories?.find((c) => c.id === id);
    if (category?.image_url) {
      await deleteFromStorage(category.image_url);
    }
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Kategori dihapus");
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const handleCategoryCancel = async () => {
    for (const url of sessionCategoryUploads) {
      await deleteFromStorage(url);
    }
    setSessionCategoryUploads([]);
    setEditingCategory(null);
  };

  const handleCloseCategories = async () => {
    for (const url of sessionCategoryUploads) {
      await deleteFromStorage(url);
    }
    setSessionCategoryUploads([]);
    setEditingCategory(null);
    setShowCategories(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Atur Produk</h1>
          <p className="text-sm text-muted-foreground">Kelola katalog kue tampah Anda.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategories(true)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <FolderTree className="h-4 w-4" /> Kelola Kategori
          </button>
          <button
            onClick={() => setEditing({ is_active: true, stock: 0, price: 0 })}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Tambah Produk
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Total Produk</div>
            <div className="text-2xl font-bold font-display mt-0.5">{products?.length ?? 0}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Stok Menipis (&lt; 10)</div>
            <div className="text-2xl font-bold font-display mt-0.5 text-amber-600">
              {products?.filter((p) => (p.stock ?? 0) < 10).length ?? 0}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
            <FolderTree className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Kategori</div>
            <div className="text-2xl font-bold font-display mt-0.5">{categories?.length ?? 0}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-accent/10 p-3 text-accent relative">
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <Package className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Produk Aktif</div>
            <div className="text-2xl font-bold font-display mt-0.5 text-accent">
              {products?.filter((p) => p.is_active).length ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama atau slug produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-border bg-background pl-10 pr-4 py-2 text-sm outline-none transition-all hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm outline-none transition-all hover:border-border/80 focus:border-primary shadow-sm cursor-pointer"
          >
            <option value="">Semua Kategori</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm outline-none transition-all hover:border-border/80 focus:border-primary shadow-sm cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-4 font-semibold">Produk</th>
              <th className="px-4 py-4 font-semibold">Harga</th>
              <th className="px-4 py-4 font-semibold">Stok</th>
              <th className="px-4 py-4 font-semibold">Status</th>
              <th className="px-4 py-4 font-semibold">Kategori</th>
              <th className="px-4 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredProducts.map((p) => {
              const imageUrl = p.image_url ? p.image_url.split(",")[0] : null;
              const categoryName = categories?.find((c) => c.id === p.category_id)?.name || "Tanpa Kategori";
              
              let stockBadge = (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                  {p.stock} pcs
                </span>
              );
              if (p.stock === 0) {
                stockBadge = (
                  <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                    Habis
                  </span>
                );
              } else if (p.stock < 10) {
                stockBadge = (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                    Sisa {p.stock} pcs
                  </span>
                );
              }

              return (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors group border-b border-border">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={p.name}
                          className="h-12 w-12 rounded-lg object-cover shadow-sm border border-border transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted border border-border text-muted-foreground">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                          {p.name}
                          {p.is_featured && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                              ★ Unggulan
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium text-foreground">
                    {formatRupiah(Number(p.price))}
                  </td>
                  <td className="px-4 py-4">
                    {stockBadge}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {p.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"></span>
                          Nonaktif
                        </span>
                      )}
                      {p.is_featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          ★ Unggulan
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {categoryName}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditing(p)}
                        className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        title="Edit Produk"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(p.id)}
                        className="rounded-full p-2 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Hapus Produk"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package className="h-10 w-10 opacity-30" />
                    <span>Tidak ada produk ditemukan.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL EDIT / TAMBAH PRODUK */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={handleCancel}
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
                onClick={handleCancel}
                className="rounded-full p-2 hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-8 md:grid-cols-3">
                {/* Left Column: Media & Visibility */}
                <div className="space-y-6 md:col-span-1">
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center justify-between">
                      Media Produk
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Bisa &gt; 1
                      </span>
                    </h3>

                    {/* Image Grid */}
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
                                className="rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-sm hover:scale-110 transition-transform cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Dropzone */}
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
                        <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary p-4 text-center">
                          <UploadCloud className="mb-2 h-8 w-8 opacity-50 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-semibold">Klik atau Drag & Drop</span>
                          <span className="mt-0.5 text-[9px] opacity-70">
                            PNG, JPG up to 10MB
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

                    <div className="mt-3">
                      <Field
                        label="Atau masukkan URL Gambar manual"
                        value={editing.image_url ?? ""}
                        onChange={(v) => setEditing({ ...editing, image_url: v })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Visibility settings */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">
                      Pengaturan Status
                    </h3>
                    <div className="flex flex-col gap-3">
                      <ToggleSwitch
                        label="Tampil di Toko"
                        description="Produk aktif & dapat dibeli pelanggan"
                        checked={!!editing.is_active}
                        onChange={(val) => setEditing({ ...editing, is_active: val })}
                      />
                      <ToggleSwitch
                        label="Produk Unggulan"
                        description="Ditampilkan prioritas di homepage"
                        checked={!!editing.is_featured}
                        onChange={(val) => setEditing({ ...editing, is_featured: val })}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Text Details */}
                <div className="space-y-6 md:col-span-2">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
                      <Package className="h-4 w-4 text-primary" /> Informasi Dasar
                    </h3>
                    <Field
                      label="Nama Produk"
                      value={editing.name ?? ""}
                      onChange={(v) =>
                        setEditing({ ...editing, name: v, slug: editing.slug || slugify(v) })
                      }
                      placeholder="Contoh: Tampah Premium 50 Kue"
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Slug (Link Otomatis)"
                        value={editing.slug ?? ""}
                        onChange={(v) => setEditing({ ...editing, slug: v })}
                        placeholder="tampah-premium"
                      />
                      <Field
                        label="Badge Label (Opsional)"
                        value={editing.badge ?? ""}
                        onChange={(v) => setEditing({ ...editing, badge: v })}
                        placeholder="Contoh: Terlaris, Spesial"
                      />
                    </div>

                    <Field
                      label="Deskripsi Lengkap"
                      value={editing.description ?? ""}
                      onChange={(v) => setEditing({ ...editing, description: v })}
                      textarea
                      placeholder="Jelaskan detail kue, porsi, isi, diameter tampah..."
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
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
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-all hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
                      >
                        <option value="">— Tanpa Kategori —</option>
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
                onClick={handleCancel}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={save}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 transition-opacity cursor-pointer"
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
            onClick={handleCloseCategories}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <h2 className="font-display text-xl font-bold">Kelola Kategori</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Kelompokkan produk agar lebih mudah ditelusuri pembeli.
                </p>
              </div>
              <button
                onClick={handleCloseCategories}
                className="rounded-full p-2 hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
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
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Tambah Kategori
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
                            <td className="px-4 py-3 font-semibold text-foreground">{c.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">/{c.slug}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setEditingCategory(c)}
                                className="mr-1 rounded-full p-2 hover:bg-muted transition-colors cursor-pointer"
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => removeCategory(c.id)}
                                className="rounded-full p-2 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
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
                  <h3 className="mb-4 text-sm font-semibold text-foreground border-b border-border pb-2">
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
                      label="Slug (Link Otomatis)"
                      value={editingCategory.slug ?? ""}
                      onChange={(v) => setEditingCategory({ ...editingCategory, slug: v })}
                      placeholder="tampah-premium"
                    />
                    <Field
                      label="Deskripsi Singkat"
                      value={editingCategory.description ?? ""}
                      onChange={(v) => setEditingCategory({ ...editingCategory, description: v })}
                      textarea
                      placeholder="Aneka kue tampah premium ukuran besar..."
                    />

                    <div>
                      <span className="text-xs font-medium text-muted-foreground mb-2 block">
                        Gambar Kategori (Opsional)
                      </span>
                      <div className="flex items-center gap-4">
                        {editingCategory.image_url && (
                          <img
                            src={editingCategory.image_url}
                            alt="Kategori"
                            className="h-16 w-16 object-cover rounded-lg border border-border shadow-sm"
                          />
                        )}
                        <label className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
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
                      <div className="mt-3">
                        <Field
                          label="Atau URL Gambar"
                          value={editingCategory.image_url ?? ""}
                          onChange={(v) => setEditingCategory({ ...editingCategory, image_url: v })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-border mt-4">
                      <button
                        onClick={handleCategoryCancel}
                        className="rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        onClick={saveCategory}
                        className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 transition-opacity cursor-pointer"
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

function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:bg-muted/50">
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {description && <span className="text-xs text-muted-foreground mt-0.5">{description}</span>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </label>
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
