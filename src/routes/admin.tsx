import { Outlet, Link, useRouterState, useNavigate, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Package, Boxes, Newspaper, ShoppingBag, Mail, BookOpen, LogOut, Loader2, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { SITE_CONFIG } from "@/lib/constants";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Dashboard Admin — Kue Tampah" }] }),
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const items: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/hero", label: "Atur Hero", icon: ImageIcon },
  { to: "/admin/produk", label: "Atur Produk", icon: Package },
  { to: "/admin/stok", label: "Atur Stok", icon: Boxes },
  { to: "/admin/artikel", label: "Atur Artikel", icon: Newspaper },
  { to: "/admin/order", label: "Order Masuk", icon: ShoppingBag },
  { to: "/admin/pesan", label: "Pesan Kontak", icon: Mail },
  { to: "/admin/panduan", label: "Panduan", icon: BookOpen },
];

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memeriksa akses...
      </div>
    );
  }

  if (!user) {
    navigate({ to: "/login" });
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="mb-4 rounded-full bg-destructive/10 p-4 text-destructive">
          <LogOut className="h-12 w-12" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Akses Ditolak</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Akun Anda (<strong>{user.email}</strong>) berhasil login, namun belum terdaftar sebagai <strong>Admin</strong> di sistem.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => signOut()} className="rounded-full border border-border px-6 py-2 text-sm font-medium hover:bg-muted">
            Keluar & Ganti Akun
          </button>
          <Link to="/" className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            Kembali ke Beranda
          </Link>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          ID User Anda: <code>{user.id}</code><br />
          Pastikan ID ini sudah ada di tabel <code>user_roles</code> dengan role <code>admin</code>.
        </p>
        
        {import.meta.env.DEV && (
          <div className="mt-12 rounded-lg border border-dashed border-primary/50 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Developer Tool</p>
            <button 
              onClick={() => {
                // Temporary session-only bypass
                window.sessionStorage.setItem('dev_admin_bypass', 'true');
                window.location.reload();
              }}
              className="text-xs text-primary underline hover:no-underline"
            >
              Bypass check & masuk sebagai Admin (Hanya lokal/dev)
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
        <Link to="/" className="flex items-center gap-3 border-b border-border p-5">
          <img src={SITE_CONFIG.logo} alt={SITE_CONFIG.name} className="h-12 w-auto object-contain" />
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Admin</div>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => {
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-sidebar-accent",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={() => signOut()} className="m-3 flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground/80 hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="h-4 w-4" /> Keluar
        </button>
      </aside>

      <div className="flex-1 overflow-auto">
        {/* Mobile top-bar */}
        <div className="flex items-center justify-between border-b border-border bg-background p-4 md:hidden">
          <Link to="/admin" className="font-display font-bold text-primary">Admin</Link>
          <button onClick={() => signOut()} className="text-sm text-muted-foreground"><LogOut className="h-4 w-4" /></button>
        </div>
        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 gap-1 border-t border-border bg-background p-2 md:hidden">
          {items.slice(0, 4).map((item) => {
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to as never} className={cn("flex flex-col items-center gap-1 rounded-md py-1 text-[10px]", active ? "text-primary" : "text-muted-foreground")}>
                <item.icon className="h-4 w-4" /> {item.label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
        <main className="p-4 pb-24 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
