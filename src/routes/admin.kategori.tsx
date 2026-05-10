import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { supabase, type Category } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/kategori")({ component: CategoryAdmin });

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function CategoryAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Category> | null>(null);

  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data as Category[] ?? [],
  });

  const save = async () => {
    if (!editing) return;
    const payload = { name: editing.name ?? "", slug: editing.slug || slugify(editing.name ?? ""), description: editing.description ?? null };
    const { error } = editing.id
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Tersimpan");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["categories"] });
  };
  const remove = async (id: string) => {
    if (!confirm("Hapus kategori?")) return;
    await supabase.from("categories").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Atur Kategori</h1>
          <p className="text-sm text-muted-foreground">Kelompokkan produk Anda.</p>
        </div>
        <button onClick={() => setEditing({})} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Tambah
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Deskripsi</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data ?? []).map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-semibold">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">/{c.slug}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.description}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(c)} className="mr-1 rounded-md p-1.5 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(c.id)} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background p-6">
            <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">{editing.id ? "Edit" : "Tambah"} Kategori</h2><button onClick={() => setEditing(null)}><X className="h-5 w-5" /></button></div>
            <div className="mt-4 space-y-3">
              <Input label="Nama" value={editing.name ?? ""} onChange={(v) => setEditing({ ...editing, name: v, slug: editing.slug || slugify(v) })} />
              <Input label="Slug" value={editing.slug ?? ""} onChange={(v) => setEditing({ ...editing, slug: v })} />
              <Input label="Deskripsi" value={editing.description ?? ""} onChange={(v) => setEditing({ ...editing, description: v })} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-full border border-border px-4 py-2 text-sm">Batal</button>
              <button onClick={save} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
    </label>
  );
}
