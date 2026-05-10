import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingCart, Menu, X, Search } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Beranda" },
  { to: "/produk", label: "Produk" },
  { to: "/tentang", label: "Tentang" },
  { to: "/artikel", label: "Artikel" },
  { to: "/kontak", label: "Kontak" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const count = useCart((s) => s.count());
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-lg font-bold">
            K
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold text-primary">Kue Tampah</div>
            <div className="-mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">Ratulangi</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                path === l.to ? "text-primary" : "text-foreground/80",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/produk"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition hover:bg-muted hover:text-primary md:inline-flex"
            aria-label="Cari produk"
          >
            <Search className="h-4 w-4" />
          </Link>
          <Link
            to="/keranjang"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/80 transition hover:bg-primary hover:text-primary-foreground"
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 hover:bg-muted md:hidden"
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
