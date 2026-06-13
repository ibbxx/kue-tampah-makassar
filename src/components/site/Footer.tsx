import { Link } from "@tanstack/react-router";
import { Instagram, MessageCircle, MapPin, Phone, Clock, ArrowRight, Mail } from "lucide-react";
import { SITE_CONFIG, SOCIAL_LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden bg-zinc-950 text-zinc-300">
      {/* Decorative gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-zinc-950 to-zinc-950 opacity-40" />

      {/* Main Footer Content */}
      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-4 md:px-8 lg:gap-16">
        {/* Brand Section */}
        <div className="col-span-1 md:col-span-1 lg:col-span-1">
          <div className="flex items-center">
            <img
              src={SITE_CONFIG.logo}
              alt={SITE_CONFIG.name}
              className="h-20 w-auto brightness-0 invert object-contain transition-transform duration-500 hover:scale-105 md:h-24"
            />
          </div>
          <p className="mt-6 text-sm leading-relaxed text-zinc-400">{SITE_CONFIG.description}</p>
          <div className="mt-8 flex gap-3">
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener"
              className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_15px_rgba(var(--primary),0.5)]"
            >
              <MessageCircle className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            </a>
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener"
              className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_15px_rgba(var(--primary),0.5)]"
            >
              <Instagram className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="mb-6 font-display text-lg font-bold text-white">Jelajahi</h4>
          <ul className="space-y-4 text-sm">
            {[
              { to: "/", label: "Beranda" },
              { to: "/produk", label: "Katalog Produk" },
              { to: "/tentang", label: "Cerita Kami" },
              { to: "/artikel", label: "Blog & Artikel" },
              { to: "/kontak", label: "Hubungi Kami" },
            ].map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="group flex items-center text-zinc-400 transition-colors hover:text-primary"
                >
                  <ArrowRight className="mr-2 h-3 w-3 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    {link.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <h4 className="mb-6 font-display text-lg font-bold text-white">Hubungi Kami</h4>
          <ul className="space-y-4 text-sm text-zinc-400">
            <li className="group flex items-start gap-3 transition-colors hover:text-white">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <MapPin className="h-3 w-3" />
              </div>
              <span className="leading-relaxed">{SITE_CONFIG.addressShort}</span>
            </li>
            <li className="group flex items-center gap-3 transition-colors hover:text-white">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Phone className="h-3 w-3" />
              </div>
              <span>{SITE_CONFIG.phone}</span>
            </li>
            <li className="group flex items-center gap-3 transition-colors hover:text-white">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Clock className="h-3 w-3" />
              </div>
              <span>{SITE_CONFIG.openingHours}</span>
            </li>
          </ul>
        </div>

        {/* Newsletter (Mock) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <h4 className="mb-6 font-display text-lg font-bold text-white">Kabar Terbaru</h4>
          <p className="mb-4 text-sm text-zinc-400">
            Dapatkan promo dan info produk terbaru langsung ke email Anda.
          </p>
          <form className="relative flex items-center" onSubmit={(e) => e.preventDefault()}>
            <Mail className="absolute left-3 h-4 w-4 text-zinc-500" />
            <input
              type="email"
              placeholder="Alamat Email"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-[110px] text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-primary focus:bg-white/10 focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 hover:shadow-[0_0_15px_rgba(var(--primary),0.4)]"
            >
              Langganan
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 border-t border-white/10 bg-black/40 py-6 text-xs text-zinc-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-8">
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="font-semibold text-white">{SITE_CONFIG.name}</span>. Hak cipta
            dilindungi.
          </p>
          <p className="flex items-center gap-1">
            Dibuat dengan <span className="animate-pulse text-red-500">♥</span> untuk melestarikan
            rasa Nusantara.
          </p>
        </div>
      </div>
    </footer>
  );
}
