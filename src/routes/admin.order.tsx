import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { supabase, type Order, formatRupiah } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/order")({ component: OrderAdmin });

const STATUSES = ["pending", "diproses", "selesai", "batal"];

type OrderWithItems = Order & { order_items: { name: string; qty: number; price: number; subtotal: number }[] };

function OrderAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, order_items(name, qty, price, subtotal)").order("created_at", { ascending: false });
      return (data ?? []) as OrderWithItems[];
    },
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
  };
  const remove = async (id: string) => {
    if (!confirm("Hapus order?")) return;
    await supabase.from("orders").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
  };

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl font-bold">Order Masuk</h1><p className="text-sm text-muted-foreground">Pantau dan update status pesanan.</p></div>
      <div className="space-y-3">
        {(data ?? []).map((o) => (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                  <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("id-ID")}</span>
                </div>
                <div className="mt-1 font-semibold">{o.customer_name} · {o.phone}</div>
                {o.address && <div className="text-sm text-muted-foreground">{o.address}</div>}
                {o.notes && <div className="mt-1 text-sm italic text-muted-foreground">"{o.notes}"</div>}
              </div>
              <div className="flex items-center gap-2">
                <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => remove(o.id)} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-3 divide-y divide-border border-t border-border pt-3 text-sm">
              {o.order_items?.map((it, i) => (
                <div key={i} className="flex justify-between py-1.5"><span>{it.name} × {it.qty}</span><span>{formatRupiah(Number(it.subtotal))}</span></div>
              ))}
              <div className="flex justify-between pt-2 font-bold text-primary"><span>Total</span><span>{formatRupiah(Number(o.total))}</span></div>
            </div>
          </div>
        ))}
        {(!data || data.length === 0) && <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">Belum ada order masuk.</div>}
      </div>
    </div>
  );
}
