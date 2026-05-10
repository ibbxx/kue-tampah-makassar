import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { useCart } from "@/lib/cart";
import { formatRupiah, supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SITE_CONFIG, SOCIAL_LINKS } from "@/lib/constants";

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
  phone: z.string().trim().min(8, "Nomor WhatsApp tidak valid").max(20),
  address: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(500).optional(),
});

const ONGKIR = 15000;

function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const subtotal = useCart((s) => s.total());
  const total = subtotal + (items.length > 0 ? ONGKIR : 0);

  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;
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
          address: parsed.data.address ?? null,
          notes: parsed.data.notes ?? null,
          total,
          status: "pending",
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
      await supabase.from("order_items").insert(orderItems);

      const lines = items.map((i) => `• ${i.name} x${i.qty} — ${formatRupiah(i.price * i.qty)}`).join("%0A");
      const msg =
        `Halo ${SITE_CONFIG.shortName}! Saya ingin pesan:%0A%0A${lines}%0A%0A` +
        `Subtotal: ${formatRupiah(subtotal)}%0AOngkir: ${formatRupiah(ONGKIR)}%0A*Total: ${formatRupiah(total)}*%0A%0A` +
        `Nama: ${parsed.data.name}%0AHP: ${parsed.data.phone}` +
        (parsed.data.address ? `%0AAlamat: ${parsed.data.address}` : "") +
        (parsed.data.notes ? `%0ACatatan: ${parsed.data.notes}` : "") +
        `%0A%0AOrder ID: ${order.id.slice(0, 8)}`;

      clear();
      toast.success("Pesanan tersimpan! Membuka WhatsApp...");
      window.open(`${SOCIAL_LINKS.whatsapp}?text=${msg}`, "_blank");
    } catch (e) {
      console.error(e);
      toast.error("Gagal memproses pesanan. Pastikan koneksi & Supabase terhubung.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-32 pb-20 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/40" />
        <h1 className="mt-4 font-display text-3xl font-bold">Keranjang Kosong</h1>
        <p className="mt-2 text-muted-foreground">Yuk pilih kue tampah favorit Anda.</p>
        <Link to="/produk" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90">
          Lihat Produk
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-32 pb-10 md:px-8">
      <h1 className="font-display text-3xl font-bold text-foreground">Keranjang Belanja</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="hidden grid-cols-[1fr_120px_140px_120px_40px] items-center gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase text-muted-foreground md:grid">
            <span>Produk</span><span>Harga</span><span>Jumlah</span><span>Subtotal</span><span></span>
          </div>
          {items.map((i) => (
            <div key={i.productId} className="grid grid-cols-2 items-center gap-4 border-b border-border px-5 py-4 last:border-0 md:grid-cols-[1fr_120px_140px_120px_40px]">
              <div className="col-span-2 flex items-center gap-3 md:col-span-1">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {i.image && <img src={i.image} alt={i.name} className="h-full w-full object-cover" />}
                </div>
                <div>
                  <div className="font-semibold">{i.name}</div>
                  <div className="text-xs text-muted-foreground md:hidden">{formatRupiah(i.price)}</div>
                </div>
              </div>
              <div className="hidden text-sm md:block">{formatRupiah(i.price)}</div>
              <div className="flex items-center gap-1 rounded-full border border-border px-1 py-1 w-fit">
                <button onClick={() => setQty(i.productId, i.qty - 1)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"><Minus className="h-3 w-3" /></button>
                <span className="min-w-[2ch] text-center text-sm font-semibold">{i.qty}</span>
                <button onClick={() => setQty(i.productId, i.qty + 1)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"><Plus className="h-3 w-3" /></button>
              </div>
              <div className="text-sm font-semibold text-primary">{formatRupiah(i.price * i.qty)}</div>
              <button onClick={() => remove(i.productId)} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary + Form */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold">Ringkasan Belanja</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ongkir</span><span>{formatRupiah(ONGKIR)}</span></div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-bold">
                <span>Total</span><span className="text-primary">{formatRupiah(total)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold">Data Pemesan</h2>
            <div className="mt-4 space-y-3">
              <Field label="Nama Lengkap" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Nomor WhatsApp" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="08xx" />
              <Field label="Alamat (opsional)" value={form.address} onChange={(v) => setForm({ ...form, address: v })} textarea />
              <Field label="Catatan (opsional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} textarea />
            </div>
            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="mt-5 w-full rounded-full bg-accent py-3 font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Memproses..." : "Checkout via WhatsApp"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, textarea,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" rows={2} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
      )}
    </label>
  );
}
