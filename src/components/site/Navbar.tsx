import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Menu, X, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { SITE_CONFIG } from "@/lib/constants";

const links = [
  { to: "/", label: "Beranda" },
  { to: "/produk", label: "Produk" },
  { to: "/tentang", label: "Tentang Kami" },
  { to: "/artikel", label: "Blog" },
  { to: "/kontak", label: "Kontak" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const count = useCart((s) => s.count());
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isSolid = scrolled || hovered || open || searchOpen;

  return (
    <header 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "fixed top-0 z-40 w-full transition-all duration-500",
        isSolid 
          ? "border-b border-border/40 bg-background/95 backdrop-blur shadow-sm supports-[backdrop-filter]:bg-background/60" 
          : "border-b-transparent bg-transparent"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center">
          <img
            src={SITE_CONFIG.logo}
            alt={SITE_CONFIG.name}
            className="h-16 object-contain md:h-24"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.querySelector('.logo-fallback')?.classList.remove('hidden');
            }}
          />
          <div className="logo-fallback hidden flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-lg font-bold">
            {SITE_CONFIG.shortName.charAt(0)}
          </div>
        </Link>

        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "text-[15px] transition-colors",
                isSolid
                  ? "hover:text-primary"
                  : "hover:text-white",
                path === l.to
                  ? isSolid
                    ? "text-primary font-bold"
                    : "text-white font-bold"
                  : isSolid
                    ? "text-foreground font-medium"
                    : "text-white/80 font-medium"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              "hidden md:flex items-center overflow-hidden rounded-full transition-all duration-300",
              searchOpen 
                ? isSolid 
                  ? "w-48 bg-muted shadow-inner ring-1 ring-border" 
                  : "w-48 bg-white/10 backdrop-blur shadow-inner ring-1 ring-white/20"
                : "w-9"
            )}
          >
            <button
              onClick={() => {
                if (searchOpen) {
                  if (searchQuery.trim()) {
                    navigate({ to: "/produk", search: { q: searchQuery } });
                    setSearchOpen(false);
                    setSearchQuery("");
                  } else {
                    setSearchOpen(false);
                  }
                } else {
                  setSearchOpen(true);
                }
              }}
              className={cn(
                "group flex h-9 min-w-9 items-center justify-center rounded-full transition-all duration-300 hover:shadow-sm z-10",
                isSolid
                  ? "text-foreground/70 hover:bg-primary/10 hover:text-primary"
                  : "text-white/80 hover:bg-white/20 hover:text-white"
              )}
              aria-label="Cari produk"
            >
              <Search className="h-4 w-4 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
            </button>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  navigate({ to: "/produk", search: { q: searchQuery } });
                  setSearchOpen(false);
                  setSearchQuery("");
                }
              }}
              placeholder="Cari..."
              className={cn(
                "h-9 bg-transparent text-sm outline-none transition-all duration-300",
                isSolid ? "text-foreground placeholder-muted-foreground" : "text-white placeholder-white/50",
                searchOpen ? "w-full px-2 opacity-100" : "w-0 px-0 opacity-0"
              )}
            />
          </div>
          <Link
            to="/keranjang"
            className={cn(
              "relative inline-flex h-9 w-9 items-center justify-center rounded-full transition",
              isSolid
                ? "bg-muted text-foreground/80 hover:bg-primary hover:text-primary-foreground"
                : "bg-white/10 text-white hover:bg-white hover:text-black"
            )}
            aria-label="Keranjang"
          >
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-full md:hidden",
              isSolid
                ? "text-foreground/70 hover:bg-muted"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            )}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-2 py-2 text-sm font-medium",
                  path === l.to ? "bg-primary/10 text-primary" : "text-foreground/80",
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
