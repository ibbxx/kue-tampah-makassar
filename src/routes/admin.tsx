import { Outlet, Link, useRouterState, useNavigate, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Package, Boxes, Newspaper, ShoppingBag, Mail, BookOpen, LogOut, Loader2, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SITE_CONFIG } from "@/lib/constants";

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator
} from "@/components/ui/sidebar";

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

  useEffect(() => {
    document.body.classList.add("admin-theme");
    return () => document.body.classList.remove("admin-theme");
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground admin-theme">
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
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center admin-theme">
        <div className="mb-4 rounded-full bg-destructive/10 p-4 text-destructive">
          <LogOut className="h-12 w-12" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Akses Ditolak</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Akun Anda (<strong>{user.email}</strong>) berhasil login, namun belum terdaftar sebagai <strong>Admin</strong> di sistem.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => signOut()} className="rounded-full border border-border px-6 py-2 text-sm font-medium hover:bg-muted transition-colors">
            Keluar & Ganti Akun
          </button>
          <Link to="/" className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="admin-theme flex min-h-screen w-full bg-background">
        <Sidebar variant="sidebar">
          <SidebarHeader className="p-4 pt-6">
            <Link to="/" className="flex items-center gap-3">
              <img src={SITE_CONFIG.logo} alt={SITE_CONFIG.name} className="h-10 w-auto object-contain dark:invert" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Admin Panel</div>
                <div className="text-sm font-bold leading-tight">{SITE_CONFIG.shortName}</div>
              </div>
            </Link>
          </SidebarHeader>
          <SidebarSeparator className="mt-2 mb-2" />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const active = item.exact ? path === item.to : path.startsWith(item.to);
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton asChild isActive={active} tooltip={item.label} className="font-medium">
                          <Link to={item.to as never}>
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 pb-6">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => signOut()} className="font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <LogOut />
                  <span>Keluar Akun</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset className="flex-1 overflow-hidden flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur px-4">
            <SidebarTrigger className="-ml-2" />
            <div className="w-full flex-1">
              <h1 className="font-semibold">{items.find((i) => i.exact ? path === i.to : path.startsWith(i.to))?.label || "Admin"}</h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-8 bg-muted/20">
            <div className="mx-auto max-w-5xl">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
