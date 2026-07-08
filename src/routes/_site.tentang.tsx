import { createFileRoute } from "@tanstack/react-router";
import { Heart, Sparkles, Users, Award } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";
import { LazyImage } from "@/components/ui/lazy-image";
import { seoMeta } from "@/lib/seo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("about_image_url")
        .eq("id", "global")
        .maybeSingle();
      if (error) return null;
      return data;
    },
  });

  const imageUrl = settings?.about_image_url || "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=1200&q=80";

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
          src={imageUrl}
          alt="Aneka kue tampah"
          className="h-72 w-full object-cover"
        />
      </div>

      <div className="prose prose-neutral mt-10 max-w-none text-foreground/80">
        <h2 className="font-display text-2xl font-bold text-primary">Latar Belakang</h2>
        <p className="text-justify">
          Terinspirasi dari budaya “Tudang Sipulung” masyarakat Bugis-Makassar yang gemar berkumpul bersama,
          PT. Berkah Bersama Gemilang melahirkan brand Kue Tampah pada Maret 2024. Brand ini hadir untuk
          memeriahkan suasana berkumpul yang disesuaikan dengan kebutuhan acara-acara di masa modern.
        </p>
        <p className="text-justify">
          Meningkatnya perbedaan selera dari setiap orang yang berkumpul mendorong Kue Tampah untuk mengkreasikan
          lebih dari 40 varian kue bercita rasa asin dan manis guna memenuhi beragam kebutuhan tersebut.
          Kini, kami hadir di dua titik strategis Kota Makassar — Jl. Dr. Ratulangi No. 82 B dan
          Jl. Perintis Kemerdekaan Km. 12 — siap menjadi penyedia suguhan ringan nomor 1 pilihan Teman Tampah
          dengan komitmen <em>"Suguhan Cinta untuk Setiap Acara"</em>.
        </p>

        <h2 className="mt-8 font-display text-2xl font-bold text-primary">Visi</h2>
        <p>
          “Menjadi perusahaan Manufaktur & Retail dalam bidang Pastry & Bakery di seluruh Indonesia yang diberkahi oleh Allah SWT dan menjadi Rahmatan Lil’Alamin”
        </p>

        <h2 className="mt-8 font-display text-2xl font-bold text-primary">Misi</h2>
        <ol>
          <li>Sumber Daya Manusia yang selalu yakin bahwa Allah selalu bersamanya dalam segala aktivitas.</li>
          <li>Memiliki sistem Keuangan yang terencana, kuat dan mandiri.</li>
          <li>Mengelola dan mengembangkan bisnis di bidang Pastry & Bakery sesuai dengan kebutuhan pasar.</li>
          <li>Peningkatan kesejahteraan karyawan berdasarkan performa kerja sesuai dengan kemampuan Perusahaan.</li>
          <li>Komitmen untuk memberikan pelayanan terbaik, fokus pada kebutuhan pelanggan & membuat produk dengan kualitas dan cita rasa terbaik.</li>
          <li>Bekerja sama untuk mencapai tujuan bersama yang berlandaskan kepercayaan, kepedulian, komunikasi dan sikap menghargai serta menghormati orang lain (Internal dan Eksternal).</li>
        </ol>

        <h2 className="mt-8 font-display text-2xl font-bold text-primary">Nilai-Nilai Utama</h2>
        <ul>
          <li>Kerja Ibadah - Bekerja dengan niat beribadah dan mengharapkan keberkahan.</li>
          <li>Integritas - Menjunjung tinggi kejujuran dan tanggung jawab penuh.</li>
          <li>Menghargai - Saling peduli dan menghormati satu sama lain secara internal maupun eksternal.</li>
          <li>Visioner & Fleksibel - Berorientasi ke depan dan adaptif terhadap perkembangan pasar.</li>
          <li>Efektif & Efisien - Bekerja cerdas untuk memberikan kualitas dan hasil terbaik.</li>
        </ul>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Heart, t: "Dibuat dengan Cinta", d: "Setiap kue dibuat fresh setiap hari." },
          { icon: Sparkles, t: "Bahan Berkualitas", d: "Hanya bahan terbaik & 100% halal." },
          { icon: Users, t: "Custom Isi", d: "Sesuaikan paket dengan tamu Anda." },
          { icon: Award, t: "Terpercaya", d: "Dipercaya ribuan pelanggan puas." },
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
