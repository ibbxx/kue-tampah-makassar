import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Clock, Send, Instagram, MessageCircle } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/kontak")({
  head: () => ({
    meta: [
      { title: "Kontak — Kue Tampah Ratulangi" },
      { name: "description", content: "Hubungi Kue Tampah Ratulangi di Jl. DR. Ratulangi, Mariso, Makassar. WhatsApp 0823-1111-3823." },
      { property: "og:title", content: "Kontak Kue Tampah Ratulangi" },
      { property: "og:description", content: "Pesan & informasi outlet di Makassar." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Nama wajib").max(100),
  email: z.string().trim().email("Email tidak valid").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().min(5, "Pesan terlalu pendek").max(1000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Cek isian");
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: parsed.data.name,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        message: parsed.data.message,
      });
      if (error) throw error;
      toast.success("Pesan terkirim! Kami akan segera menghubungi Anda.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengirim pesan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold text-primary">Hubungi Kami</h1>
        <p className="mt-2 text-muted-foreground">Kami siap membantu kebutuhan kue tampah terbaik untuk Anda.</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <ContactCard icon={Phone} title="WhatsApp" text="0823-1111-3823" href="https://wa.me/6282311113823" />
          <ContactCard icon={Instagram} title="Instagram" text="@kuetampah.id" href="https://instagram.com/kuetampah.id" />
          <ContactCard icon={MapPin} title="Alamat" text="Jl. DR. Ratulangi, Mariso, Makassar, Sulawesi Selatan 90125" />
          <ContactCard icon={Clock} title="Jam Buka" text="Senin – Minggu, 06.00 – 20.00 WITA" />
          <ContactCard icon={Mail} title="Email" text="halo@kuetampah.id" href="mailto:halo@kuetampah.id" />

          <div className="overflow-hidden rounded-2xl border border-border">
            <iframe
              title="Lokasi Kue Tampah Ratulangi"
              src="https://www.google.com/maps?q=Jl.+DR.+Ratulangi,+Mariso,+Makassar&output=embed"
              className="h-72 w-full"
              loading="lazy"
            />
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">Kirim Pesan</h2>
          <div className="mt-5 space-y-4">
            <Field label="Nama Lengkap" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
            <Field label="Nomor WhatsApp" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field label="Pesan Anda" value={form.message} onChange={(v) => setForm({ ...form, message: v })} textarea />
          </div>
          <button
            disabled={submitting}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> {submitting ? "Mengirim..." : "Kirim Pesan"}
          </button>
          <a
            href="https://wa.me/6282311113823"
            target="_blank"
            rel="noopener"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent py-3 font-semibold text-accent hover:bg-accent hover:text-accent-foreground"
          >
            <MessageCircle className="h-4 w-4" /> Chat WhatsApp Langsung
          </a>
        </form>
      </div>
    </div>
  );
}

function ContactCard({ icon: Icon, title, text, href }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string; href?: string }) {
  const inner = (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-semibold text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground">{text}</div>
      </div>
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noopener">{inner}</a> : inner;
}

function Field({ label, value, onChange, type = "text", textarea }: { label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
      )}
    </label>
  );
}
