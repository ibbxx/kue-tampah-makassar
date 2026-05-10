import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { supabase, type Article } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/artikel")({ component: ArticleAdmin });

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function ArticleAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Article> | null>(null);
  const { data } = useQuery({
    queryKey: ["admin", "articles"],
    queryFn: async () => (await supabase.from("articles").select("*").order("created_at", { ascending: false })).data as Article[] ?? [],
  });

  const save = async () => {
    if (!editing) return;
    const payload = {
      title: editing.title ?? "",
      slug: editing.slug || slugify(editing.title ?? ""),
      excerpt: editing.excerpt ?? null,
      content: editing.content ?? null,
      cover_url: editing.cover_url ?? null,
      published: editing.published ?? false,
    };
    const { error } = editing.id
      ? await supabase.from("articles").update(payload).eq("id", editing.id)
      : await supabase.from("articles").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Tersimpan");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin", "articles"] });
  };
  const remove = async (id: string) => {
    if (!confirm("Hapus artikel?")) return;
    await supabase.from("articles").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "articles"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-3xl font-bold">Atur Artikel</h1><p className="text-sm text-muted-foreground">Kelola konten blog.</p></div>
        <button onClick={() => setEditing({ published: false })} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Tulis
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="px-4 py-3">Judul</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Tanggal</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data ?? []).map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3"><div className="font-semibold">{a.title}</div><div className="text-xs text-muted-foreground">/{a.slug}</div></td>
                <td className="px-4 py-3">{a.published ? <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">Publish</span> : <span className="text-xs text-muted-foreground">Draft</span>}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(a.created_at).toLocaleDateString("id-ID")}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(a)} className="mr-1 rounded-md p-1.5 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(a.id)} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {(!data || data.length === 0) && <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">Belum ada artikel.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl bg-background p-6">
            <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">{editing.id ? "Edit" : "Tulis"} Artikel</h2><button onClick={() => setEditing(null)}><X className="h-5 w-5" /></button></div>
            <div className="mt-4 space-y-3">
              <Input label="Judul" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v, slug: editing.slug || slugify(v) })} />
              <Input label="Slug" value={editing.slug ?? ""} onChange={(v) => setEditing({ ...editing, slug: v })} />
              <Input label="URL Cover" value={editing.cover_url ?? ""} onChange={(v) => setEditing({ ...editing, cover_url: v })} />
              <Input label="Excerpt" value={editing.excerpt ?? ""} onChange={(v) => setEditing({ ...editing, excerpt: v })} textarea />
              <Input label="Konten" value={editing.content ?? ""} onChange={(v) => setEditing({ ...editing, content: v })} textarea rows={10} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> Publikasikan</label>
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

function Input({ label, value, onChange, textarea, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean; rows?: number }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
      )}
    </label>
  );
}
