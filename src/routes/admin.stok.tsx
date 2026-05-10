import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase, type Product, type Category } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/stok")({
  component: StockAdmin,
});

function StockAdmin() {
  const qc = useQueryClient();
  const { data: products } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => (await supabase.from("products").select("*").order("name")).data as Product[] ?? [],
  });
  
  const { data: categories } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data as Category[] ?? [],
  });

  const [stocks, setStocks] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (products) setStocks(Object.fromEntries(products.map((p) => [p.id, p.stock])));
  }, [products]);

  const update = async (id: string) => {
    const { error } = await supabase.from("products").update({ stock: stocks[id] }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Stok diperbarui");
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
  };

  const filteredProducts = products?.filter((p) => selectedCategory === "all" || p.category_id === selectedCategory) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Atur Stok</h1>
          <p className="text-sm text-muted-foreground">Pilih kategori dan perbarui angka stok produk.</p>
        </div>
        
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
        >
          <option value="all">Semua Kategori</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3 w-32">Stok</th>
              <th className="px-4 py-3 w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredProducts.map((p) => {
              const dirty = stocks[p.id] !== p.stock;
              const cat = categories?.find(c => c.id === p.category_id);
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-semibold">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {cat?.name ?? "Tanpa Kategori"}
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      value={stocks[p.id] ?? 0} 
                      onChange={(e) => setStocks({ ...stocks, [p.id]: Number(e.target.value) })}
                      className={`w-24 rounded-lg border bg-background px-3 py-1.5 text-sm outline-none ${dirty ? "border-primary text-primary font-bold" : "border-border"}`} 
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      disabled={!dirty} 
                      onClick={() => update(p.id)} 
                      className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-30"
                    >
                      <Save className="h-3 w-3" /> Simpan
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Tidak ada produk.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
