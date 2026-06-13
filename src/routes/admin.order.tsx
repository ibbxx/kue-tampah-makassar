import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  ChevronDown,
  Phone,
  MapPin,
  SearchX,
  ShoppingBag,
  CreditCard,
  Image as ImageIcon,
  ExternalLink,
  Mail,
  Truck,
  Banknote,
} from "lucide-react";
import { supabase, type Order, formatRupiah } from "@/lib/supabase";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/order")({ component: OrderAdmin });

const STATUSES = ["pending", "diproses", "dikirim", "selesai", "batal"] as const;
type OrderStatus = (typeof STATUSES)[number];

type OrderWithItems = Order & {
  order_items: { name: string; qty: number; price: number; subtotal: number }[];
};

// Status UI configuration
const STATUS_UI = {
  pending: {
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-500/20",
    border: "border-amber-200 dark:border-amber-500/30",
    label: "Menunggu",
  },
  diproses: {
    icon: Package,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-500/20",
    border: "border-blue-200 dark:border-blue-500/30",
    label: "Diproses",
  },
  dikirim: {
    icon: Truck,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-500/20",
    border: "border-purple-200 dark:border-purple-500/30",
    label: "Dikirim",
  },
  selesai: {
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-500/20",
    border: "border-emerald-200 dark:border-emerald-500/30",
    label: "Selesai",
  },
  batal: {
    icon: XCircle,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-500/20",
    border: "border-rose-200 dark:border-rose-500/30",
    label: "Dibatalkan",
  },
};

function OrderAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "semua">("semua");
  const [paymentFilter, setPaymentFilter] = useState<string>("semua");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const toggleExpand = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(name, qty, price, subtotal)")
        .order("created_at", { ascending: false });
      return (data ?? []) as OrderWithItems[];
    },
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status pesanan diperbarui");
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
  };

  const confirmPayment = async (id: string) => {
    const { error } = await supabase.from("orders").update({ status: "diproses" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Pembayaran dikonfirmasi — status → Diproses");
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus pesanan ini secara permanen?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Pesanan dihapus");
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
  };

  // Derived data
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      const matchesSearch =
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        (o.order_number ?? "").toLowerCase().includes(search.toLowerCase()) ||
        o.phone.includes(search);
      const matchesFilter = filter === "semua" || o.status === filter;
      const matchesPayment =
        paymentFilter === "semua" ||
        (paymentFilter === "transfer" && o.payment_method?.toLowerCase().includes("transfer")) ||
        (paymentFilter === "cod" && (o.payment_method?.toLowerCase().includes("cod") || o.payment_method?.toLowerCase().includes("tempat"))) ||
        (paymentFilter === "with_proof" && o.payment_proof_url);
      return matchesSearch && matchesFilter && matchesPayment;
    });
  }, [orders, search, filter, paymentFilter]);

  const stats = useMemo(() => {
    if (!orders) return { total: 0, pending: 0, revenue: 0, needConfirmation: 0 };
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      revenue: orders
        .filter((o) => o.status === "selesai")
        .reduce((acc, o) => acc + Number(o.total), 0),
      needConfirmation: orders.filter(
        (o) => o.status === "pending" && o.payment_proof_url
      ).length,
    };
  }, [orders]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Proof Preview Modal */}
      {proofPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setProofPreview(null)}
        >
          <div className="relative max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden bg-background shadow-2xl">
            <button
              onClick={() => setProofPreview(null)}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
            >
              <XCircle className="h-5 w-5" />
            </button>
            <img
              src={proofPreview}
              alt="Bukti Transfer"
              className="w-full h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* HEADER & STATS */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Order Masuk</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau, proses, dan kelola semua pesanan pelanggan.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm min-w-[120px]">
            <div className="text-xs font-medium text-muted-foreground">Total</div>
            <div className="mt-1 font-display text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm min-w-[120px] dark:bg-amber-500/10 dark:border-amber-500/20">
            <div className="text-xs font-medium text-amber-600 dark:text-amber-400">Menunggu</div>
            <div className="mt-1 font-display text-2xl font-bold text-amber-700 dark:text-amber-300">
              {stats.pending}
            </div>
          </div>
          {stats.needConfirmation > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm min-w-[120px] dark:bg-blue-500/10 dark:border-blue-500/20 animate-pulse">
              <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Perlu Konfirmasi
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-blue-700 dark:text-blue-300">
                {stats.needConfirmation}
              </div>
            </div>
          )}
          <div className="hidden rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm min-w-[140px] dark:bg-emerald-500/10 dark:border-emerald-500/20 md:block">
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Pendapatan
            </div>
            <div className="mt-1 font-display text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatRupiah(stats.revenue)}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-card/50 p-2 border border-border shadow-sm backdrop-blur-sm">
        <div className="flex overflow-x-auto p-1 scrollbar-hide gap-1">
          <button
            onClick={() => setFilter("semua")}
            className={cn(
              "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              filter === "semua"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Semua
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize",
                filter === s
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {STATUS_UI[s].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-2 pb-2 sm:px-0 sm:pb-0 sm:pr-2">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-xl border border-border bg-background py-2.5 px-3 text-sm outline-none transition-colors focus:border-primary shadow-sm"
          >
            <option value="semua">Semua Pembayaran</option>
            <option value="transfer">Transfer Bank</option>
            <option value="cod">COD</option>
            <option value="with_proof">Ada Bukti Transfer</option>
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama, ID, no HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-56 rounded-xl border border-border bg-background py-2.5 pl-9 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* ORDER LIST */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-sm text-muted-foreground">Memuat data pesanan...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((o) => {
            const statusConfig = STATUS_UI[o.status as OrderStatus] || STATUS_UI.pending;
            const StatusIcon = statusConfig.icon;
            const isExpanded = expanded[o.id];
            const hasBankTransfer =
              o.payment_method?.toLowerCase().includes("transfer") ||
              o.payment_method?.toLowerCase().includes("bca") ||
              o.payment_method?.toLowerCase().includes("bri") ||
              o.payment_method?.toLowerCase().includes("mandiri");

            return (
              <div
                key={o.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/30"
              >
                {/* Colored accent bar */}
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1.5 transition-opacity",
                    statusConfig.bg,
                    "opacity-70 group-hover:opacity-100",
                  )}
                />

                {/* Compact Header (Always Visible) */}
                <div
                  className="p-4 sm:p-5 pl-6 sm:pl-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-muted/10 transition-colors"
                  onClick={() => toggleExpand(o.id)}
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="font-mono text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border shadow-sm">
                      {o.order_number ?? `#${o.id.slice(0, 8).toUpperCase()}`}
                    </div>
                    <div className="text-sm font-bold text-foreground">{o.customer_name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(o.created_at).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                        statusConfig.bg,
                        statusConfig.color,
                        statusConfig.border,
                      )}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusConfig.label}
                    </div>
                    {/* Payment method badge */}
                    <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                      {hasBankTransfer ? (
                        <CreditCard className="h-3 w-3" />
                      ) : (
                        <Banknote className="h-3 w-3" />
                      )}
                      {o.payment_method ?? "—"}
                    </div>
                    {/* Proof indicator */}
                    {o.payment_proof_url && (
                      <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                        <ImageIcon className="h-3 w-3" />
                        Bukti
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="font-display text-lg font-bold text-primary">
                      {formatRupiah(Number(o.total))}
                    </div>
                    <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                      {isExpanded ? "Tutup" : "Detail"}
                      <ChevronDown
                        className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/10 p-5 sm:p-6 pl-6 sm:pl-8 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      {/* Order Info */}
                      <div className="flex-1 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" /> No HP / WhatsApp
                            </div>
                            <a
                              href={`https://wa.me/${o.phone.replace(/^0/, "62").replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-semibold text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {o.phone}
                            </a>
                          </div>

                          {o.email && (
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" /> Email
                              </div>
                              <a
                                href={`mailto:${o.email}`}
                                className="text-sm font-semibold text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {o.email}
                              </a>
                            </div>
                          )}

                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> Alamat & Catatan
                            </div>
                            {o.address ? (
                              <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
                                {o.address}
                              </p>
                            ) : (
                              <p className="text-sm italic text-muted-foreground bg-background p-2 rounded-lg border border-border/50 shadow-sm inline-block">
                                Diambil di tempat (Pickup)
                              </p>
                            )}
                            {o.notes && (
                              <p className="mt-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 p-2.5 rounded-lg border border-amber-200 dark:border-amber-500/20 shadow-sm">
                                <span className="font-semibold mr-1">Catatan:</span> {o.notes}
                              </p>
                            )}
                          </div>

                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                              <CreditCard className="h-3.5 w-3.5" /> Pembayaran
                            </div>
                            <div className="text-sm font-semibold">{o.payment_method ?? "—"}</div>
                          </div>
                        </div>

                        {/* Payment Proof */}
                        {o.payment_proof_url && (
                          <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 p-4">
                            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                              <ImageIcon className="h-3.5 w-3.5" /> Bukti Transfer
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProofPreview(o.payment_proof_url!);
                                }}
                                className="h-20 w-20 rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-all cursor-pointer"
                              >
                                <img
                                  src={o.payment_proof_url}
                                  alt="Bukti"
                                  className="h-full w-full object-cover"
                                />
                              </button>
                              <div className="flex flex-col gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProofPreview(o.payment_proof_url!);
                                  }}
                                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" /> Lihat Full
                                </button>
                                {o.status === "pending" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmPayment(o.id);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Konfirmasi Pembayaran
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Pending without proof */}
                        {o.status === "pending" && !o.payment_proof_url && hasBankTransfer && (
                          <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                            ⏳ Pelanggan belum upload bukti transfer.
                          </div>
                        )}
                      </div>

                      {/* Order Items & Actions */}
                      <div className="flex w-full flex-col gap-4 lg:w-[360px] shrink-0 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6">
                        <div className="space-y-3">
                          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <ShoppingBag className="h-3.5 w-3.5" /> Item Pesanan
                          </div>
                          <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
                            {o.order_items?.map((it, i) => (
                              <div
                                key={i}
                                className="flex items-start justify-between gap-3 text-sm"
                              >
                                <div className="flex-1 font-medium">{it.name}</div>
                                <div className="text-muted-foreground whitespace-nowrap bg-background border border-border shadow-sm px-1.5 py-0.5 rounded text-xs">
                                  x{it.qty}
                                </div>
                                <div className="w-[90px] text-right font-semibold">
                                  {formatRupiah(Number(it.subtotal))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-dashed border-border">
                          <div className="relative flex-1">
                            <select
                              value={o.status}
                              onChange={(e) => setStatus(o.id, e.target.value)}
                              className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium outline-none transition-all hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                            >
                              {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_UI[s].label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          </div>
                          <button
                            onClick={() => remove(o.id)}
                            className="flex items-center justify-center h-[42px] w-[42px] rounded-xl border border-destructive/20 text-destructive bg-background hover:bg-destructive hover:text-destructive-foreground transition-colors shadow-sm"
                            title="Hapus Pesanan"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-24 text-center animate-in fade-in duration-500">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted shadow-inner">
              <SearchX className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-5 font-display text-xl font-bold">Tidak ada pesanan ditemukan</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-[280px]">
              {search || filter !== "semua"
                ? "Coba sesuaikan kata kunci pencarian atau filter status Anda."
                : "Belum ada pesanan yang masuk ke toko Anda."}
            </p>
            {(search || filter !== "semua") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("semua");
                  setPaymentFilter("semua");
                }}
                className="mt-6 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-5 py-2.5 rounded-full transition-colors"
              >
                Reset Pencarian & Filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
