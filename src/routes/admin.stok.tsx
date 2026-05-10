import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase, type Product } from "@/lib/supabase";
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
  const [stocks, setStocks] = useState<Record<string, number>>({});

  useEffect(() => {
    if (products) setStocks(Object.fromEntries(products.map((p) => [p.id, p.stock])));
  }, [products]);

  const update = async (id: string) => {
    const { error } = await supabase.from("products").update({ stock: stocks[id] }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Stok diperbarui");
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Atur Stok</h1>
        <p className="text-sm text-muted-foreground">Update stok produk secara cepat.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="px-4 py-3">Produk</th><th className="px-4 py-3 w-32">Stok</th><th className="px-4 py-3 w-24"></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(products ?? []).map((p) => {
              const dirty = stocks[p.id] !== p.stock;
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-semibold">{p.name}</td>
                  <td className="px-4 py-3">
                    <input type="number" value={stocks[p.id] ?? 0} onChange={(e) => setStocks({ ...stocks, [p.id]: Number(e.target.value) })}
                      className={`w-24 rounded-lg border bg-background px-3 py-1.5 text-sm ${dirty ? "border-primary" : "border-border"}`} />
                  </td>
                  <td className="px-4 py-3">
                    <button disabled={!dirty} onClick={() => update(p.id)} className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-30">
                      <Save className="h-3 w-3" /> Simpan
                    </button>
                  </td>
                </tr>
              );
            })}
            {(!products || products.length === 0) && <tr><td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">Belum ada produk.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
