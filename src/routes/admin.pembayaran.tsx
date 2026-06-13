import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Building2,
  Banknote,
  Wallet,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  CreditCard,
  SearchX,
} from "lucide-react";
import { useState } from "react";
import { supabase, type PaymentMethod } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/pembayaran")({
  component: PaymentMethodsAdmin,
});

const TYPES = [
  { value: "bank_transfer", label: "Transfer Bank", icon: Building2 },
  { value: "cod", label: "Bayar di Tempat (COD)", icon: Banknote },
  { value: "ewallet", label: "E-Wallet", icon: Wallet },
] as const;

const emptyForm = {
  name: "",
  type: "bank_transfer" as string,
  bank_name: "",
  account_number: "",
  account_name: "",
  instructions: "",
  is_active: true,
  sort_order: 0,
};

function PaymentMethodsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: methods, isLoading } = useQuery({
    queryKey: ["admin", "payment-methods"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_methods")
        .select("*")
        .order("sort_order");
      return (data ?? []) as PaymentMethod[];
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: (methods?.length ?? 0) + 1 });
    setCreating(true);
  };

  const openEdit = (m: PaymentMethod) => {
    setCreating(false);
    setEditing(m);
    setForm({
      name: m.name,
      type: m.type,
      bank_name: m.bank_name ?? "",
      account_number: m.account_number ?? "",
      account_name: m.account_name ?? "",
      instructions: m.instructions ?? "",
      is_active: m.is_active,
      sort_order: m.sort_order,
    });
  };

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nama metode wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        bank_name: form.bank_name.trim() || null,
        account_number: form.account_number.trim() || null,
        account_name: form.account_name.trim() || null,
        instructions: form.instructions.trim() || null,
        is_active: form.is_active,
        sort_order: form.sort_order,
      };

      if (editing) {
        const { error } = await supabase
          .from("payment_methods")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Metode pembayaran diperbarui");
      } else {
        const { error } = await supabase.from("payment_methods").insert(payload);
        if (error) throw error;
        toast.success("Metode pembayaran ditambahkan");
      }
      closeForm();
      qc.invalidateQueries({ queryKey: ["admin", "payment-methods"] });
    } catch (e: any) {
      toast.error(e.message ?? "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (m: PaymentMethod) => {
    const { error } = await supabase
      .from("payment_methods")
      .update({ is_active: !m.is_active })
      .eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success(m.is_active ? "Metode dinonaktifkan" : "Metode diaktifkan");
    qc.invalidateQueries({ queryKey: ["admin", "payment-methods"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus metode pembayaran ini?")) return;
    const { error } = await supabase.from("payment_methods").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Metode pembayaran dihapus");
    qc.invalidateQueries({ queryKey: ["admin", "payment-methods"] });
  };

  const showForm = creating || editing;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Metode Pembayaran</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola rekening bank, COD, dan metode pembayaran lainnya.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Tambah Metode
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold">
              {editing ? "Edit Metode Pembayaran" : "Tambah Metode Baru"}
            </h2>
            <button
              onClick={closeForm}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-5">
            {/* Type Selection */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Tipe Pembayaran</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = form.type === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setForm({ ...form, type: t.value })}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border-2 p-3 text-left text-sm font-medium transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Nama Metode *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Transfer BCA"
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            {/* Bank-specific fields */}
            {form.type === "bank_transfer" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Nama Bank</label>
                  <input
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    placeholder="BCA"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Nomor Rekening</label>
                  <input
                    value={form.account_number}
                    onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                    placeholder="1234567890"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Atas Nama</label>
                  <input
                    value={form.account_name}
                    onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                    placeholder="PT Kue Tampah"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* E-Wallet fields */}
            {form.type === "ewallet" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Nomor E-Wallet</label>
                  <input
                    value={form.account_number}
                    onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                    placeholder="0812xxxx"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Atas Nama</label>
                  <input
                    value={form.account_name}
                    onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                    placeholder="Nama Pemilik"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Instructions */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Instruksi Pembayaran</label>
              <textarea
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="Instruksi yang akan ditampilkan ke pelanggan setelah checkout..."
                rows={3}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            {/* Sort Order & Active */}
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground">Urutan Tampil</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  className="mt-1 w-24 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium border transition-all",
                  form.is_active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400"
                    : "border-border bg-muted text-muted-foreground"
                )}
              >
                {form.is_active ? (
                  <ToggleRight className="h-5 w-5" />
                ) : (
                  <ToggleLeft className="h-5 w-5" />
                )}
                {form.is_active ? "Aktif" : "Nonaktif"}
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <button
                onClick={closeForm}
                className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Memuat data...</p>
          </div>
        ) : methods && methods.length > 0 ? (
          methods.map((m) => {
            const TypeIcon =
              TYPES.find((t) => t.value === m.type)?.icon ?? CreditCard;
            return (
              <div
                key={m.id}
                className={cn(
                  "group flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md",
                  m.is_active
                    ? "border-border hover:border-primary/30"
                    : "border-border/50 opacity-60"
                )}
              >
                <div className="flex h-6 w-6 items-center justify-center text-muted-foreground cursor-grab">
                  <GripVertical className="h-4 w-4" />
                </div>

                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                    m.type === "bank_transfer"
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                      : m.type === "cod"
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                        : "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
                  )}
                >
                  <TypeIcon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{m.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        m.is_active
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {m.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  {m.account_number && (
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {m.bank_name && `${m.bank_name} — `}
                      {m.account_number}
                      {m.account_name && ` (${m.account_name})`}
                    </div>
                  )}
                  {m.type === "cod" && (
                    <div className="text-xs text-muted-foreground mt-0.5">Bayar saat pengiriman</div>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleActive(m)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                      m.is_active
                        ? "text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                    title={m.is_active ? "Nonaktifkan" : "Aktifkan"}
                  >
                    {m.is_active ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(m)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(m.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted shadow-inner">
              <CreditCard className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-5 font-display text-xl font-bold">Belum ada metode pembayaran</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-[300px]">
              Tambahkan rekening bank, COD, atau metode pembayaran lainnya agar pelanggan bisa checkout.
            </p>
            <button
              onClick={openCreate}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all"
            >
              <Plus className="h-4 w-4" />
              Tambah Metode Pertama
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
