import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login Admin — Kue Tampah" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && isAdmin) navigate({ to: "/admin" });
  }, [loading, user, isAdmin, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Login berhasil");
    navigate({ to: "/admin" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary/30 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <Link to="/" className="block text-center">
          <img src={SITE_CONFIG.logo} alt={SITE_CONFIG.name} className="mx-auto h-24 w-auto object-contain" />
          <div className="mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Admin Dashboard</div>
        </Link>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Password</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
          <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <Lock className="h-4 w-4" /> {busy ? "Memproses..." : "Login"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Belum punya akun admin? Buat lewat dashboard Supabase, lalu tambahkan role 'admin' di tabel <code>user_roles</code>.
        </p>
        <Link to="/" className="mt-4 block text-center text-xs text-primary hover:underline">← Kembali ke beranda</Link>
      </div>
    </div>
  );
}
