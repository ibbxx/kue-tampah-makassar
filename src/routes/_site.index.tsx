import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, ShieldCheck, Truck, Package, Star, ChevronDown } from "lucide-react";
import { supabase, type Product, type Category } from "@/lib/supabase";
import { ProductCard } from "@/components/site/ProductCard";
import { useState } from "react";

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "Kue Tampah Ratulangi — Suguhan Acara Khas Makassar" },
      {
        name: "description",
        content:
          "Pesan paket kue tampah, jajanan pasar Makassar, kue dos & suguhan acara di Jl. DR. Ratulangi Mariso Makassar. Halal, fresh, custom isi.",
      },
      { property: "og:title", content: "Kue Tampah Ratulangi" },
      { property: "og:description", content: "Suguhan acara cantik & lengkap khas Makassar." },
    ],
  }),
  component: HomePage,
});

const features = [
  { icon: ShieldCheck, title: "Bahan Berkualitas", desc: "Dipilih dengan teliti" },
  { icon: Sparkles, title: "100% Halal", desc: "Aman dan terpercaya" },
  { icon: Truck, title: "Pengiriman Cepat", desc: "Sampai tepat waktu" },
  { icon: Package, title: "Packing Aman", desc: "Rapi & higienis" },
];

const testimonials = [
  { name: "Siti Nurhaliza", text: "Kuenya enak, segar, dan cantik. Pelayanan ramah dan pengiriman tepat waktu. Pasti langganan lagi!" },
  { name: "Andi Pratama", text: "Cocok untuk acara keluarga. Semua tamu suka rasanya. Tampahnya juga cantik dan rapi." },
  { name: "Dewi Kartika", text: "Variasinya banyak dan rasanya nampol. Harga sesuai kualitas. Recommended!" },
];

const faqs = [
  {
    q: "Berapa minimal pemesanan paket kue tampah?",
    a: "Minimal pemesanan 1 paket Tampah Mini. Untuk acara besar (>50 orang) sebaiknya pesan H-2 hari.",
  },
  {
    q: "Apakah isi tampah bisa dicustom?",
    a: "Bisa. Anda bisa request kombinasi kue tradisional, snack gurih, atau kue manis sesuai budget dan jumlah tamu.",
  },
  {
    q: "Area pengiriman?",
    a: "Seluruh kota Makassar dan sekitarnya. Ongkir disesuaikan jarak dari outlet Jl. DR. Ratulangi.",
  },
  {
    q: "Apakah produk halal?",
    a: "Iya, seluruh kue dan bahan baku 100% halal.",
  },
];

function HomePage() {
  const { data: featured } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(8);
      return (data ?? []) as Product[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*");
      return (data ?? []) as Category[];
    },
  });

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-background to-secondary/40">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-8 md:py-24">
          <div>
            <p className="font-display text-lg italic text-primary">Kue Tradisional, Rasa Istimewa</p>
            <h1 className="mt-2 font-display text-5xl font-bold leading-[1.05] text-foreground md:text-6xl">
              Kue Tampah <br /> Khas <span className="text-primary">Makassar</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              Aneka kue tradisional dibuat dengan bahan berkualitas dan cinta — siap memeriahkan momen spesial keluarga Anda.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/produk"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90"
              >
                Belanja Sekarang <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/produk"
                className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                Lihat Produk
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square overflow-hidden rounded-full border-8 border-background bg-gradient-to-br from-primary/20 to-accent/20 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800&q=80"
                alt="Kue tampah tradisional Makassar"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-2xl bg-background p-4 shadow-xl md:flex md:items-center md:gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Star className="h-6 w-6 fill-primary" />
              </div>
              <div>
                <div className="font-bold text-foreground">4.6 / 5.0</div>
                <div className="text-xs text-muted-foreground">30+ ulasan pelanggan</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature strip */}
        <div className="border-t border-border bg-background">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 md:grid-cols-4 md:px-8">
            {features.map((f) => (
              <div key={f.title} className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <h2 className="font-display text-2xl font-bold text-primary">Kategori Populer</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {(categories ?? []).slice(0, 4).map((c) => (
            <Link
              key={c.id}
              to="/produk"
              search={{ kategori: c.slug }}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="aspect-square overflow-hidden bg-gradient-to-br from-secondary to-muted">
                <div className="flex h-full items-center justify-center font-display text-4xl text-primary/30">
                  {c.name.charAt(0)}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground">{c.name}</h3>
                <p className="line-clamp-1 text-xs text-muted-foreground">{c.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="bg-secondary/40 py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold text-primary">Produk Unggulan</h2>
              <p className="mt-2 text-muted-foreground">Pilihan terbaik untuk momen spesial Anda.</p>
            </div>
            <Link to="/produk" className="hidden text-sm font-semibold text-primary hover:underline md:inline-flex">
              Lihat semua →
            </Link>
          </div>
          {featured && featured.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-border bg-background p-10 text-center text-muted-foreground">
              Belum ada produk unggulan. Admin sedang menyiapkan menu terbaik untuk Anda.
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-primary">Apa Kata Pelanggan Kami</h2>
          <p className="mt-2 text-muted-foreground">Kepuasan Anda adalah kebahagiaan kami</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-5xl leading-none text-primary">"</div>
              <p className="mt-2 text-sm text-foreground/80">{t.text}</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">Pelanggan</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-secondary/40 py-16">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <h2 className="text-center font-display text-3xl font-bold text-primary">Pertanyaan yang Sering Ditanya</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-10 text-primary-foreground md:p-16">
          <div className="md:max-w-xl">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Siap memesan untuk acara Anda?</h2>
            <p className="mt-3 opacity-90">Hubungi kami sekarang dan dapatkan paket suguhan terbaik untuk tamu istimewa.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/produk" className="inline-flex rounded-full bg-background px-6 py-3 text-sm font-semibold text-primary hover:opacity-90">
                Lihat Katalog
              </Link>
              <a href="https://wa.me/6282311113823" target="_blank" rel="noopener" className="inline-flex rounded-full border-2 border-background px-6 py-3 text-sm font-semibold text-background hover:bg-background hover:text-primary">
                Chat WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-semibold text-foreground"
      >
        {q}
        <ChevronDown className={`h-5 w-5 shrink-0 text-primary transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-4 text-sm text-muted-foreground">{a}</div>}
    </div>
  );
}
