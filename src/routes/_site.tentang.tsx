import { createFileRoute } from "@tanstack/react-router";
import { Heart, Sparkles, Users, Award } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";
import { LazyImage } from "@/components/ui/lazy-image";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/_site/tentang")({
  head: () => {
    const { meta, links } = seoMeta({
      title: "Tentang Kami",
      description: `Cerita di balik ${SITE_CONFIG.name} — pelestari kue tradisional khas ${SITE_CONFIG.city}. Visi, misi, dan komitmen kami.`,
      path: "/tentang",
    });
    return { meta, links };
  },
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-32 pb-12 md:px-8">
      <div className="text-center">
        <p className="font-display text-lg italic text-primary">Cerita Kami</p>
        <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
          Tentang {SITE_CONFIG.name}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Pelestari kue tradisional {SITE_CONFIG.city} dengan sentuhan modern — siap menemani setiap
          momen istimewa Anda.
        </p>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl">
        <LazyImage
          src="https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=1200&q=80"
          alt="Aneka kue tampah"
          className="h-72 w-full object-cover"
        />
      </div>

      <div className="prose prose-neutral mt-10 max-w-none text-foreground/80">
        <h2 className="font-display text-2xl font-bold text-primary">Latar Belakang</h2>
        <p>
          {SITE_CONFIG.shortName} hadir dari kecintaan kami terhadap kekayaan kuliner tradisional{" "}
          {SITE_CONFIG.city}. Berawal dari acara keluarga yang membutuhkan suguhan praktis namun
          tetap istimewa, kami mengembangkan paket tampah yang menggabungkan beragam jajanan khas —
          mulai dari pie buah, bolu gulung pandan, gogos tuna, risol mayo, kue ku', lumpia,
          macaroni, hingga nona manis.
        </p>

        <h2 className="mt-8 font-display text-2xl font-bold text-primary">Visi</h2>
        <p>
          Menjadi pilihan utama suguhan acara di {SITE_CONFIG.city} dengan menjaga cita rasa
          tradisional dalam kemasan modern.
        </p>

        <h2 className="mt-8 font-display text-2xl font-bold text-primary">Misi</h2>
        <ul>
          <li>Menjaga keaslian rasa kue tradisional {SITE_CONFIG.city}.</li>
          <li>Menyajikan paket suguhan yang praktis, cantik, dan custom sesuai kebutuhan.</li>
          <li>Memberi pengalaman pelayanan yang ramah dan tepat waktu.</li>
        </ul>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Heart, t: "Dibuat dengan Cinta", d: "Setiap kue dibuat fresh setiap hari." },
          { icon: Sparkles, t: "Bahan Berkualitas", d: "Hanya bahan terbaik & 100% halal." },
          { icon: Users, t: "Custom Isi", d: "Sesuaikan paket dengan tamu Anda." },
          { icon: Award, t: "Rating 4.6/5.0", d: "Dipercaya 30+ pelanggan tetap." },
        ].map((v) => (
          <div key={v.t} className="rounded-2xl border border-border bg-card p-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <v.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-3 font-semibold">{v.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{v.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
