import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Building2,
  Banknote,
  Wallet,
  Truck,
  MapPin,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/lib/cart";
import { formatRupiah, supabase, type PaymentMethod } from "@/lib/supabase";
import { toast } from "sonner";
import { SITE_CONFIG } from "@/lib/constants";
import { LazyImage } from "@/components/ui/lazy-image";

export const Route = createFileRoute("/_site/keranjang")({
  head: () => ({
    meta: [
      { title: `Keranjang Belanja — ${SITE_CONFIG.name}` },
      { name: "description", content: "Lihat keranjang belanja dan checkout pesanan Anda." },
    ],
  }),
  component: CartPage,
});

const formSchema = z.object({
  name: z.string().trim().min(2, "Nama wajib diisi").max(100),
  phone: z.string().trim().min(8, "Nomor HP tidak valid").max(20),
  email: z.string().trim().email("Email tidak valid").optional().or(z.literal("")),
  address: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(500).optional(),
});

const ONGKIR = 15000;

type Step = 1 | 2 | 3;

const STEP_LABELS = ["Keranjang", "Data & Pengiriman", "Pembayaran"];

const PAYMENT_TYPE_ICONS: Record<string, typeof CreditCard> = {
  bank_transfer: Building2,
  cod: Banknote,
  ewallet: Wallet,
};

function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const subtotal = useCart((s) => s.total());
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [isPickup, setIsPickup] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ongkirAmount = isPickup ? 0 : ONGKIR;
  const total = subtotal + (items.length > 0 ? ongkirAmount : 0);

  // Fetch payment methods
  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return (data ?? []) as PaymentMethod[];
    },
  });

  const selectedPaymentObj = paymentMethods?.find((p) => p.id === selectedPayment);

  const goNext = () => {
    if (step === 1) {
      if (items.length === 0) return;
      setStep(2);
    } else if (step === 2) {
      const parsed = formSchema.safeParse(form);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Cek isian form");
        return;
      }
      if (!isPickup && !form.address?.trim()) {
        toast.error("Alamat pengiriman wajib diisi untuk Pesan Antar");
        return;
      }
      setStep(3);
    }
  };

  const goBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleCheckout = async () => {
    if (items.length === 0 || !selectedPayment || !selectedPaymentObj) return;
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Cek isian form");
      return;
    }
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          customer_name: parsed.data.name,
          phone: parsed.data.phone,
          email: parsed.data.email || null,
          address: isPickup ? null : (parsed.data.address ?? null),
          notes: parsed.data.notes ?? null,
          total,
          status: "pending",
          payment_method: selectedPaymentObj.name,
        })
        .select()
        .single();
      if (error) throw error;

      const orderItems = items.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        name: i.name,
        price: i.price,
        qty: i.qty,
        subtotal: i.price * i.qty,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      clear();
      toast.success("Pesanan berhasil dibuat!");
      navigate({ to: "/order/$id", params: { id: order.id } });
    } catch (e) {
      console.error(e);
      toast.error("Gagal memproses pesanan. Pastikan koneksi & Supabase terhubung.");
    } finally {
      setSubmitting(false);
    }
  };

  // Empty cart
  if (items.length === 0 && step === 1) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-32 pb-20 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold">Keranjang Kosong</h1>
        <p className="mt-2 text-muted-foreground">Yuk pilih kue tampah favorit Anda.</p>
        <Link
          to="/produk"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-90 transition-all"
        >
          Lihat Produk
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-32 pb-10 md:px-8">
      {/* Stepper */}
      <div className="mb-10">
        <div className="flex items-center justify-center gap-0">
          {STEP_LABELS.map((label, i) => {
            const stepNum = (i + 1) as Step;
            const isCurrent = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div key={label} className="flex items-center">
                {i > 0 && (
                  <div
                    className={`h-0.5 w-8 sm:w-16 transition-colors duration-300 ${isDone ? "bg-primary" : "bg-border"}`}
                  />
                )}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110"
                        : isDone
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-5 w-5" /> : stepNum}
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors ${isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Main Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
          {step === 1 && (
            <CartStep items={items} setQty={setQty} remove={remove} />
          )}
          {step === 2 && (
            <ShippingStep
              form={form}
              setForm={setForm}
              isPickup={isPickup}
              setIsPickup={setIsPickup}
            />
          )}
          {step === 3 && (
            <PaymentStep
              paymentMethods={paymentMethods ?? []}
              selectedPayment={selectedPayment}
              setSelectedPayment={setSelectedPayment}
            />
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-xl font-bold">Ringkasan Belanja</h2>
            {/* Compact item list */}
            <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {items.map((i) => (
                <div key={i.productId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate mr-2">
                    {i.name} <span className="text-xs">x{i.qty}</span>
                  </span>
                  <span className="font-medium whitespace-nowrap">{formatRupiah(i.price * i.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 text-sm border-t border-border pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ongkir</span>
                {isPickup ? (
                  <span className="text-primary font-medium">Gratis (Pickup)</span>
                ) : (
                  <span>{formatRupiah(ONGKIR)}</span>
                )}
              </div>
              {selectedPaymentObj && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pembayaran</span>
                  <span className="font-medium text-xs">{selectedPaymentObj.name}</span>
                </div>
              )}
              <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatRupiah(total)}</span>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={goBack}
                className="flex-1 flex items-center justify-center gap-2 rounded-full border border-border py-3 font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Kembali
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={goNext}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-90 transition-all"
              >
                Lanjutkan
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={submitting || !selectedPayment}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-accent py-3.5 font-semibold text-accent-foreground shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Buat Pesanan
                  </>
                )}
              </button>
            )}
          </div>

          {step === 3 && (
            <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              <span>Data Anda aman dan terenkripsi. Pesanan akan dikonfirmasi setelah pembayaran diverifikasi.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Step 1: Cart Items ─────────────── */
function CartStep({
  items,
  setQty,
  remove,
}: {
  items: ReturnType<typeof useCart.getState>["items"];
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
}) {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">
        Keranjang Belanja ({items.length} item)
      </h1>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="hidden grid-cols-[1fr_120px_140px_120px_40px] items-center gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase text-muted-foreground md:grid">
          <span>Produk</span>
          <span>Harga</span>
          <span>Jumlah</span>
          <span>Subtotal</span>
          <span></span>
        </div>
        {items.map((i) => (
          <div
            key={i.productId}
            className="grid grid-cols-2 items-center gap-4 border-b border-border px-5 py-4 last:border-0 md:grid-cols-[1fr_120px_140px_120px_40px] transition-colors hover:bg-muted/30"
          >
            <div className="col-span-2 flex items-center gap-3 md:col-span-1">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {i.image && (
                  <LazyImage src={i.image} alt={i.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div>
                <div className="font-semibold">{i.name}</div>
                <div className="text-xs text-muted-foreground md:hidden">
                  {formatRupiah(i.price)}
                </div>
              </div>
            </div>
            <div className="hidden text-sm md:block">{formatRupiah(i.price)}</div>
            <div className="flex items-center gap-1 rounded-full border border-border px-1 py-1 w-fit">
              <button
                onClick={() => setQty(i.productId, i.qty - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[2ch] text-center text-sm font-semibold">{i.qty}</span>
              <button
                onClick={() => setQty(i.productId, i.qty + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <div className="text-sm font-semibold text-primary">
              {formatRupiah(i.price * i.qty)}
            </div>
            <button
              onClick={() => remove(i.productId)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Step 2: Shipping & Contact ─────────────── */
function ShippingStep({
  form,
  setForm,
  isPickup,
  setIsPickup,
}: {
  form: { name: string; phone: string; email: string; address: string; notes: string };
  setForm: (f: typeof form) => void;
  isPickup: boolean;
  setIsPickup: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Data Pemesan</h2>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <Field
          label="Nama Lengkap *"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          placeholder="Masukkan nama lengkap"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nomor HP / WhatsApp *"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
            placeholder="08xx"
            type="tel"
          />
          <Field
            label="Email (opsional)"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            placeholder="email@contoh.com"
            type="email"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="font-display text-lg font-bold">Metode Pengiriman</h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setIsPickup(false)}
            className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
              !isPickup
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${!isPickup ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">Pesan Antar</div>
              <div className="text-xs text-muted-foreground">Ongkir {formatRupiah(ONGKIR)}</div>
            </div>
            {!isPickup && <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />}
          </button>

          <button
            onClick={() => setIsPickup(true)}
            className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
              isPickup
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isPickup ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">Ambil Sendiri</div>
              <div className="text-xs text-muted-foreground">Gratis ongkir</div>
            </div>
            {isPickup && <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />}
          </button>
        </div>

        {!isPickup && (
          <Field
            label="Alamat Pengiriman *"
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan, Kota"
            textarea
          />
        )}

        {isPickup && (
          <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
            <div className="font-semibold text-foreground mb-1">Lokasi Pickup</div>
            {SITE_CONFIG.address}
          </div>
        )}

        <Field
          label="Catatan Pesanan (opsional)"
          value={form.notes}
          onChange={(v) => setForm({ ...form, notes: v })}
          placeholder="Contoh: tolong packing ekstra, kirim jam 10 pagi"
          textarea
        />
      </div>
    </div>
  );
}

/* ─────────────── Step 3: Payment Method ─────────────── */
function PaymentStep({
  paymentMethods,
  selectedPayment,
  setSelectedPayment,
}: {
  paymentMethods: PaymentMethod[];
  selectedPayment: string | null;
  setSelectedPayment: (id: string) => void;
}) {
  const bankMethods = paymentMethods.filter((p) => p.type === "bank_transfer");
  const codMethods = paymentMethods.filter((p) => p.type === "cod");
  const ewalletMethods = paymentMethods.filter((p) => p.type === "ewallet");

  const renderGroup = (title: string, methods: PaymentMethod[], icon: typeof CreditCard) => {
    if (methods.length === 0) return null;
    const Icon = icon;
    return (
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <Icon className="h-4 w-4" />
          {title}
        </h3>
        <div className="space-y-2">
          {methods.map((m) => {
            const isSelected = selectedPayment === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedPayment(m.id)}
                className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold text-sm ${
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {m.bank_name?.slice(0, 3).toUpperCase() ?? m.type === "cod" ? "COD" : "PAY"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{m.name}</div>
                  {m.account_number && (
                    <div className="text-sm text-muted-foreground">
                      {m.account_number} — <span className="text-xs">{m.account_name}</span>
                    </div>
                  )}
                  {m.type === "cod" && (
                    <div className="text-xs text-muted-foreground">Bayar saat pesanan tiba</div>
                  )}
                </div>
                {isSelected && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Pilih Metode Pembayaran</h2>

      {paymentMethods.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">
            Belum ada metode pembayaran yang tersedia.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          {renderGroup("Transfer Bank", bankMethods, Building2)}
          {renderGroup("E-Wallet", ewalletMethods, Wallet)}
          {renderGroup("Bayar di Tempat", codMethods, Banknote)}
        </div>
      )}

      {selectedPayment && paymentMethods.find((p) => p.id === selectedPayment)?.instructions && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 text-sm text-amber-700 dark:text-amber-300">
          <div className="font-semibold mb-1">📋 Instruksi Pembayaran</div>
          {paymentMethods.find((p) => p.id === selectedPayment)?.instructions}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Shared Field Component ─────────────── */
function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  type?: string;
}) {
  const cls =
    "mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/30 shadow-sm";
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
          rows={3}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </label>
  );
}
