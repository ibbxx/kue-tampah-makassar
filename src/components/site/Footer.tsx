import { Link } from "@tanstack/react-router";
import { Instagram, MessageCircle, MapPin, Phone, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4 md:px-8">
        <div>
          <div className="font-display text-2xl font-bold text-primary">Kue Tampah</div>
          <div className="text-xs uppercase tracking-widest opacity-70">Cabang Ratulangi</div>
          <p className="mt-4 text-sm opacity-80">
            Suguhan acara cantik & lengkap khas Makassar. Kue tradisional, jajanan pasar, dan paket tampah custom.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-display text-lg font-semibold">Menu</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/" className="hover:text-primary">Beranda</Link></li>
            <li><Link to="/produk" className="hover:text-primary">Produk</Link></li>
            <li><Link to="/tentang" className="hover:text-primary">Tentang</Link></li>
            <li><Link to="/artikel" className="hover:text-primary">Artikel</Link></li>
            <li><Link to="/kontak" className="hover:text-primary">Kontak</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-display text-lg font-semibold">Kontak</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> Jl. DR. Ratulangi, Mariso, Makassar</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> 0823-1111-3823</li>
            <li className="flex items-center gap-2"><Clock className="h-4 w-4" /> 06.00 – 20.00 WITA</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-display text-lg font-semibold">Ikuti Kami</h4>
          <div className="flex gap-3">
            <a href="https://wa.me/6282311113823" target="_blank" rel="noopener" className="flex h-10 w-10 items-center justify-center rounded-full bg-background/10 hover:bg-primary"><MessageCircle className="h-5 w-5" /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener" className="flex h-10 w-10 items-center justify-center rounded-full bg-background/10 hover:bg-primary"><Instagram className="h-5 w-5" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-background/10 bg-primary py-4 text-center text-xs text-primary-foreground">
        © {new Date().getFullYear()} Kue Tampah Ratulangi. Dibuat dengan ♥ untuk melestarikan kue tradisional Indonesia.
      </div>
    </footer>
  );
}
