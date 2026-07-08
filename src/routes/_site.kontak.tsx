import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Clock, Send, Instagram, MessageCircle } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SITE_CONFIG, SOCIAL_LINKS } from "@/lib/constants";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/_site/kontak")({
  head: () => {
    const { meta, links } = seoMeta({
      title: "Kontak & Lokasi",
      description: `Hubungi ${SITE_CONFIG.name} di ${SITE_CONFIG.addressShort}. WhatsApp ${SITE_CONFIG.phone}. Buka ${SITE_CONFIG.openingHours}.`,
      path: "/kontak",
    });
    return { meta, links };
  },
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Nama wajib").max(100),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().min(5, "Pesan terlalu pendek").max(1000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<"ratulangi" | "perintis">("ratulangi");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Cek isian");
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        message: parsed.data.message,
      });
      if (error) throw error;
      toast.success("Pesan terkirim! Kami akan segera menghubungi Anda.");
      setForm({ name: "", phone: "", message: "" });
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengirim pesan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-32 pb-12 md:px-8">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold text-primary">Hubungi Kami</h1>
        <p className="mt-2 text-muted-foreground">
          Kami siap membantu kebutuhan kue tampah terbaik untuk Anda.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <ContactCard
              icon={Phone}
              title="WhatsApp"
              text={SITE_CONFIG.phone}
              href={SOCIAL_LINKS.whatsapp}
            />
            <ContactCard
              icon={Instagram}
              title="Instagram"
              text={SITE_CONFIG.instagram}
              href={SOCIAL_LINKS.instagram}
            />
            <ContactCard icon={Clock} title="Jam Buka" text={SITE_CONFIG.openingHours} />
            <div className="sm:col-span-2 space-y-3">
              <div className="text-xs font-semibold text-foreground px-1">Lokasi Kami</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedBranch("ratulangi")}
                  className={`text-left block w-full rounded-2xl border p-4 transition-all duration-200 hover:shadow-sm focus:outline-none ${
                    selectedBranch === "ratulangi"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                      selectedBranch === "ratulangi" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                    }`}>
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                        Cabang Ratulangi
                        {selectedBranch === "ratulangi" && (
                          <span className="inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            Terpilih
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {SITE_CONFIG.address}
                      </div>
                      <a
                        href="https://www.google.com/maps/search/Kue+Tampah+Jl.+DR.+Ratulangi+No.+82+Makassar"
                        target="_blank"
                        rel="noopener"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                      >
                        Buka Maps
                        <Send className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBranch("perintis")}
                  className={`text-left block w-full rounded-2xl border p-4 transition-all duration-200 hover:shadow-sm focus:outline-none ${
                    selectedBranch === "perintis"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                      selectedBranch === "perintis" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                    }`}>
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                        Cabang Perintis
                        {selectedBranch === "perintis" && (
                          <span className="inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            Terpilih
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {SITE_CONFIG.addressPerintis}
                      </div>
                      <a
                        href="https://maps.app.goo.gl/nHLqSSiUY5LXoS2L9"
                        target="_blank"
                        rel="noopener"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                      >
                        Buka Maps
                        <Send className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border transition-all duration-200 hover:border-primary/40 hover:shadow-sm">
            <iframe
              title={`Lokasi Kue Tampah Cabang ${selectedBranch === "ratulangi" ? "Ratulangi" : "Perintis"}`}
              src={selectedBranch === "ratulangi" ? SITE_CONFIG.mapEmbedUrl : SITE_CONFIG.mapEmbedUrlPerintis}
              className="h-72 w-full transition-all duration-300"
              loading="lazy"
            />
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-xl font-bold">Kirim Pesan</h2>
          <div className="mt-5 space-y-4">
            <Field
              label="Nama Lengkap"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
            />
            <Field
              label="Nomor WhatsApp"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
            />
            <Field
              label="Pesan Anda"
              value={form.message}
              onChange={(v) => setForm({ ...form, message: v })}
              textarea
            />
          </div>
          <button
            disabled={submitting}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> {submitting ? "Mengirim..." : "Kirim Pesan"}
          </button>
          <a
            href={SOCIAL_LINKS.whatsapp}
            target="_blank"
            rel="noopener"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent py-3 font-semibold text-accent transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:shadow-md active:scale-[0.98]"
          >
            <MessageCircle className="h-4 w-4" /> Chat WhatsApp Langsung
          </a>
        </form>
      </div>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  title,
  text,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  href?: string;
}) {
  const inner = (
    <div className="flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-semibold text-foreground">{title}</div>
        <div className="mt-1 text-sm text-muted-foreground">{text}</div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener" className="block h-full">
      {inner}
    </a>
  ) : (
    inner
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      )}
    </label>
  );
}
