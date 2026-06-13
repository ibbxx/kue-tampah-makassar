import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Boxes,
  ShoppingBag,
  Mail,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Clock,
  CheckCircle2,
  ArrowRight,
  Banknote,
  ImageIcon,
} from "lucide-react";
import { supabase, formatRupiah } from "@/lib/supabase";
import { cn } from "@/lib/utils";

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
        supabase
          .from("orders")
          .select("id, total, status, payment_method, payment_proof_url, customer_name, order_number, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("contact_messages")
          .select("id", { count: "exact", head: true })
          .eq("is_read", false),
      ]);

      const allOrders = orders.data ?? [];
      const completedOrders = allOrders.filter((o) => o.status === "selesai");
      const revenue = completedOrders.reduce((acc, o) => acc + Number(o.total), 0);
      const pendingOrders = allOrders.filter((o) => o.status === "pending");
      const needConfirmation = pendingOrders.filter((o) => o.payment_proof_url);

      return {
        products: products.count ?? 0,
        lowStock: lowStock.count ?? 0,
        unreadMessages: messages.count ?? 0,
        recentOrders: allOrders.slice(0, 5),
        pendingOrders: pendingOrders.length,
        needConfirmation: needConfirmation.length,
        revenue,
      };
    },
  });

  const cards = [
    {
      label: "Total Produk",
      value: stats?.products ?? 0,
      icon: Package,
      color: "bg-primary/10 text-primary",
      borderColor: "border-primary/20",
    },
    {
      label: "Stok Rendah",
      value: stats?.lowStock ?? 0,
      icon: AlertTriangle,
      color: "bg-destructive/10 text-destructive",
      borderColor: "border-destructive/20",
    },
    {
      label: "Order Pending",
      value: stats?.pendingOrders ?? 0,
      icon: Clock,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Perlu Konfirmasi",
      value: stats?.needConfirmation ?? 0,
      icon: ImageIcon,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-500/20",
      highlight: (stats?.needConfirmation ?? 0) > 0,
    },
    {
      label: "Pesan Belum Dibaca",
      value: stats?.unreadMessages ?? 0,
      icon: Mail,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      borderColor: "border-purple-500/20",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ringkasan aktivitas toko Anda</p>
      </div>

      {/* Revenue Card */}
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              Total Pendapatan (Selesai)
            </div>
            <div className="mt-2 font-display text-4xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatRupiah(stats?.revenue ?? 0)}
            </div>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-200/50 dark:bg-emerald-500/20">
            <Banknote className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className={cn(
              "rounded-2xl border bg-card p-5 transition-all hover:shadow-md",
              c.borderColor,
              c.highlight && "ring-2 ring-blue-500/30 animate-pulse"
            )}
          >
            <div
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${c.color}`}
            >
              <c.icon className="h-5 w-5" />
            </div>
            <div className="mt-3 text-3xl font-bold">{c.value}</div>
            <div className="text-xs text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Order Terbaru</h2>
          <Link
            to="/admin/order"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {stats?.recentOrders.length ? (
          <div className="divide-y divide-border">
            {stats.recentOrders.map((o) => {
              const isPending = o.status === "pending";
              const hasProof = !!o.payment_proof_url;
              return (
                <div key={o.id} className="flex items-center justify-between py-3.5 text-sm gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {o.order_number ?? `#${o.id.slice(0, 8)}`}
                    </span>
                    <span className="font-medium truncate">{o.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPending && hasProof && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                        <ImageIcon className="h-3 w-3" />
                        Bukti
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        o.status === "pending" && "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
                        o.status === "diproses" && "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
                        o.status === "selesai" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
                        o.status === "batal" && "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
                        o.status === "dikirim" && "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
                      )}
                    >
                      {o.status}
                    </span>
                    <span className="font-semibold text-primary min-w-[90px] text-right">
                      {formatRupiah(Number(o.total))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Belum ada order.</p>
        )}
      </div>
    </div>
  );
}
