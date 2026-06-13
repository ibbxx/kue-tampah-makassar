import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Copy,
  Clock,
  Package,
  CreditCard,
  Upload,
  Phone,
  Home,
  Search,
  ImageIcon,
  Loader2,
  XCircle,
  Truck,
} from "lucide-react";
import { useState, useRef } from "react";
import { supabase, formatRupiah, uploadToStorage, type Order } from "@/lib/supabase";
import { toast } from "sonner";
import { SITE_CONFIG } from "@/lib/constants";

export const Route = createFileRoute("/_site/order/$id")({
  head: () => ({
    meta: [
      { title: `Detail Pesanan — ${SITE_CONFIG.name}` },
      { name: "description", content: "Lihat detail dan status pesanan Anda." },
    ],
  }),
  component: OrderConfirmationPage,
});

type OrderWithItems = Order & {
  order_items: { name: string; qty: number; price: number; subtotal: number }[];
};

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

const TIMELINE_STEPS = ["pending", "diproses", "dikirim", "selesai"];

function OrderConfirmationPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(name, qty, price, subtotal)")
        .eq("id", id)
        .maybeSingle();
      return data as OrderWithItems | null;
    },
    refetchInterval: 15000, // Refresh every 15s for status updates
  });

  const handleUploadProof = async (file: File) => {
    if (!order) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${order.id}/${Date.now()}.${ext}`;
      const url = await uploadToStorage("payment-proofs", path, file);

      const { error } = await supabase
        .from("orders")
        .update({ payment_proof_url: url })
        .eq("id", order.id);
      if (error) throw error;

      toast.success("Bukti transfer berhasil diupload!");
      qc.invalidateQueries({ queryKey: ["order", id] });
    } catch (e) {
      console.error(e);
      toast.error("Gagal upload bukti transfer.");
    } finally {
      setUploading(false);
    }
  };

  const copyOrderNumber = () => {
    if (!order?.order_number) return;
    navigator.clipboard.writeText(order.order_number);
    toast.success("Nomor pesanan disalin!");
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-32 pb-20 text-center text-muted-foreground">
        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
        <p className="mt-4">Memuat detail pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-32 pb-20 text-center">
        <Search className="mx-auto h-16 w-16 text-muted-foreground/40" />
        <h1 className="mt-4 font-display text-3xl font-bold">Pesanan Tidak Ditemukan</h1>
        <p className="mt-2 text-muted-foreground">ID pesanan tidak valid atau sudah dihapus.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          <Home className="h-4 w-4" />
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_UI[order.status] ?? STATUS_UI.pending;
  const StatusIcon = statusConfig.icon;
  const isBankTransfer = order.payment_method?.toLowerCase().includes("transfer") || order.payment_method?.toLowerCase().includes("bca") || order.payment_method?.toLowerCase().includes("bri") || order.payment_method?.toLowerCase().includes("mandiri");
  const currentStepIdx = TIMELINE_STEPS.indexOf(order.status);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-32 pb-10 md:px-8">
      {/* Success Header */}
      <div className="text-center mb-10 animate-in fade-in zoom-in-95 duration-500">
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${statusConfig.bg}`}>
          <StatusIcon className={`h-10 w-10 ${statusConfig.color}`} />
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold">
          {order.status === "pending" ? "Pesanan Berhasil Dibuat!" : statusConfig.label}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {order.status === "pending"
            ? "Silakan selesaikan pembayaran Anda."
            : `Pesanan Anda sedang ${statusConfig.label.toLowerCase()}.`}
        </p>
      </div>

      {/* Order Number Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm text-center mb-8">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nomor Pesanan</div>
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="font-mono text-2xl font-bold text-primary tracking-wider">
            {order.order_number ?? order.id.slice(0, 8).toUpperCase()}
          </span>
          <button
            onClick={copyOrderNumber}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
            title="Salin nomor pesanan"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Simpan nomor ini untuk melacak pesanan Anda.
        </p>
      </div>

      {/* Timeline */}
      {order.status !== "batal" && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm mb-8">
          <h2 className="font-display text-lg font-bold mb-6">Status Pesanan</h2>
          <div className="flex items-center justify-between px-4">
            {TIMELINE_STEPS.map((s, i) => {
              const isActive = i <= currentStepIdx;
              const isCurrent = s === order.status;
              const config = STATUS_UI[s] ?? STATUS_UI.pending;
              const Icon = config.icon;
              return (
                <div key={s} className="flex flex-col items-center relative flex-1">
                  {i > 0 && (
                    <div
                      className={`absolute top-5 -left-1/2 w-full h-0.5 -z-10 transition-colors ${
                        isActive ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-primary/20"
                        : isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`mt-2 text-[10px] font-medium text-center ${isCurrent ? "text-primary font-bold" : isActive ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Order Details */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold mb-4">Detail Pesanan</h2>
          <div className="space-y-3">
            {order.order_items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>
                  {item.name} <span className="text-muted-foreground">x{item.qty}</span>
                </span>
                <span className="font-semibold">{formatRupiah(Number(item.subtotal))}</span>
              </div>
            ))}
            <div className="border-t border-border pt-3 mt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatRupiah(Number(order.total))}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nama</span>
              <span className="font-medium">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telepon</span>
              <span className="font-medium">{order.phone}</span>
            </div>
            {order.email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{order.email}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pengiriman</span>
              <span className="font-medium">{order.address ? "Pesan Antar" : "Ambil Sendiri"}</span>
            </div>
            {order.address && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Alamat</span>
                <span className="font-medium text-right max-w-[60%]">{order.address}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pembayaran</span>
              <span className="font-medium">{order.payment_method}</span>
            </div>
            {order.notes && (
              <div className="rounded-lg bg-muted/50 p-3 mt-2">
                <span className="text-xs font-semibold text-muted-foreground">Catatan:</span>
                <p className="text-sm mt-0.5">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Proof Upload / Payment Instructions */}
        <div className="space-y-6">
          {isBankTransfer && order.status === "pending" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Instruksi Pembayaran
              </h2>
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm">
                <p className="font-semibold text-primary">{order.payment_method}</p>
                <p className="mt-2 text-muted-foreground">
                  Silakan transfer sesuai total pesanan, lalu upload bukti transfer di bawah.
                </p>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">Upload Bukti Transfer</h3>
                {order.payment_proof_url ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-xl border border-border">
                      <img
                        src={order.payment_proof_url}
                        alt="Bukti Transfer"
                        className="w-full max-h-[300px] object-contain bg-muted"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Bukti transfer telah diupload
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadProof(file);
                      }}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Mengupload...
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5" />
                          <span>
                            Klik untuk upload bukti transfer
                            <br />
                            <span className="text-xs">(JPG, PNG, max 5MB)</span>
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Support */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold mb-3">Butuh Bantuan?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Hubungi kami jika ada pertanyaan tentang pesanan Anda.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={`https://wa.me/${SITE_CONFIG.whatsapp}?text=Halo, saya ingin bertanya tentang pesanan ${order.order_number ?? order.id.slice(0, 8)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                <Phone className="h-4 w-4 text-primary" />
                Hubungi via WhatsApp
              </a>
              <Link
                to="/lacak"
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                <Search className="h-4 w-4 text-primary" />
                Lacak Pesanan Lain
              </Link>
            </div>
          </div>

          <Link
            to="/"
            className="flex items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-90 transition-all"
          >
            <Home className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
