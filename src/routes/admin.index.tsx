import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, Boxes, ShoppingBag, Mail, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [products, lowStock, orders, messages] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).lte("stock", 5),
        supabase.from("orders").select("id, total, status, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
      ]);
      return {
        products: products.count ?? 0,
        lowStock: lowStock.count ?? 0,
        unreadMessages: messages.count ?? 0,
        recentOrders: orders.data ?? [],
        pendingOrders: (orders.data ?? []).filter((o) => o.status === "pending").length,
      };
    },
  });

  const cards = [
    { label: "Total Produk", value: stats?.products ?? 0, icon: Package, color: "bg-primary/10 text-primary" },
    { label: "Stok Rendah", value: stats?.lowStock ?? 0, icon: AlertTriangle, color: "bg-destructive/10 text-destructive" },
    { label: "Order Pending", value: stats?.pendingOrders ?? 0, icon: ShoppingBag, color: "bg-accent/10 text-accent" },
    { label: "Pesan Belum Dibaca", value: stats?.unreadMessages ?? 0, icon: Mail, color: "bg-chart-3/10 text-chart-3" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ringkasan aktivitas toko Anda</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${c.color}`}><c.icon className="h-5 w-5" /></div>
            <div className="mt-3 text-3xl font-bold">{c.value}</div>
            <div className="text-xs text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-bold">Order Terbaru</h2>
        {stats?.recentOrders.length ? (
          <div className="mt-4 divide-y divide-border">
            {stats.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-mono text-xs">#{o.id.slice(0, 8)}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{o.status}</span>
                <span className="font-semibold text-primary">Rp {Number(o.total).toLocaleString("id-ID")}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Belum ada order.</p>
        )}
      </div>
    </div>
  );
}
