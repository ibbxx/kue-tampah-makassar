import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  SearchX,
  Truck,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, formatRupiah, type Order } from "@/lib/supabase";
import { SITE_CONFIG } from "@/lib/constants";

export const Route = createFileRoute("/_site/lacak")({
  head: () => ({
    meta: [
      { title: `Lacak Pesanan — ${SITE_CONFIG.name}` },
      { name: "description", content: "Lacak status pesanan Anda dengan nomor pesanan atau nomor HP." },
    ],
  }),
  component: TrackOrderPage,
});

const STATUS_UI: Record<string, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  pending: {
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-500/20",
    label: "Menunggu Pembayaran",
  },
  diproses: {
    icon: Package,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-500/20",
    label: "Sedang Diproses",
  },
  dikirim: {
    icon: Truck,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-500/20",
    label: "Dalam Pengiriman",
  },
  selesai: {
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-500/20",
    label: "Selesai",
  },
  batal: {
    icon: XCircle,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-500/20",
    label: "Dibatalkan",
  },
};

function TrackOrderPage() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const { data: results, isLoading, isError } = useQuery({
    queryKey: ["track-order", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];

      // Try order_number first
      const { data: byNumber } = await supabase
        .from("orders")
        .select("*")
        .ilike("order_number", `%${searchTerm}%`);

      if (byNumber && byNumber.length > 0) return byNumber as Order[];

      // Try by phone
      const { data: byPhone } = await supabase
        .from("orders")
        .select("*")
        .ilike("phone", `%${searchTerm}%`)
        .order("created_at", { ascending: false })
        .limit(10);

      return (byPhone ?? []) as Order[];
    },
    enabled: !!searchTerm,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchTerm(query.trim());
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-32 pb-20 md:px-8">
      {/* Header */}
      <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Search className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold md:text-4xl">Lacak Pesanan</h1>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          Masukkan nomor pesanan atau nomor HP untuk melihat status pesanan Anda.
        </p>
      </div>

      {/* Search Box */}
      <form onSubmit={handleSearch} className="mb-10">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nomor pesanan (KT-...) atau nomor HP..."
            className="w-full rounded-2xl border border-border bg-card py-4 pl-14 pr-32 text-base outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-primary px-6 py-2.5 font-semibold text-primary-foreground text-sm shadow-lg shadow-primary/25 hover:opacity-90 transition-all"
          >
            Cari
          </button>
        </div>
      </form>

      {/* Results */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Mencari pesanan...</p>
        </div>
      )}

      {searchTerm && !isLoading && results && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-300">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <SearchX className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-5 font-display text-xl font-bold">Pesanan Tidak Ditemukan</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Pastikan nomor pesanan atau nomor HP yang Anda masukkan sudah benar.
          </p>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-400">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {results.length} pesanan ditemukan
          </h3>
          {results.map((order) => {
            const statusConfig = STATUS_UI[order.status] ?? STATUS_UI.pending;
            const StatusIcon = statusConfig.icon;
            return (
              <Link
                key={order.id}
                to="/order/$id"
                params={{ id: order.id }}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${statusConfig.bg}`}>
                  <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {order.order_number ?? `#${order.id.slice(0, 8).toUpperCase()}`}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{order.customer_name}</span>
                    <span>•</span>
                    <span>
                      {new Date(order.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-base font-bold text-primary">
                    {formatRupiah(Number(order.total))}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Help Section */}
      {!searchTerm && (
        <div className="mt-8 rounded-2xl border border-border bg-card/50 p-6 text-center">
          <h3 className="font-display text-lg font-bold">Belum Punya Pesanan?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Yuk jelajahi aneka kue tampah khas Makassar dan buat pesanan pertama Anda!
          </p>
          <Link
            to="/produk"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-90 transition-all"
          >
            Lihat Produk
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
