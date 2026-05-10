import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, ShoppingCart, ChevronRight, ImageOff, ShieldCheck, Truck, Sparkles, Package } from "lucide-react";
import { useState } from "react";
import { supabase, type Product, formatRupiah } from "@/lib/supabase";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/produk/$slug")({
  component: ProductDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 pt-32 pb-20 text-center">
      <h1 className="font-display text-3xl">Produk tidak ditemukan</h1>
      <Link to="/produk" className="mt-4 inline-block text-primary hover:underline">← Kembali ke katalog</Link>
    </div>
  ),
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
      return data as Product | null;
    },
  });

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 pt-32 pb-20 text-center text-muted-foreground">Memuat...</div>;
  }
  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-32 pb-20 text-center">
        <h1 className="font-display text-3xl">Produk tidak ditemukan</h1>
        <Link to="/produk" className="mt-4 inline-block text-primary hover:underline">← Kembali ke katalog</Link>
      </div>
    );
  }

  const handleAdd = () => {
    if (product.stock <= 0) return toast.error("Stok habis");
    add({ productId: product.id, name: product.name, price: Number(product.price), image: product.image_url }, qty);
    toast.success(`${product.name} (${qty}x) ditambahkan`);
  };
  const handleBuy = () => {
    handleAdd();
    router.navigate({ to: "/keranjang" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-32 pb-10 md:px-8">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">Beranda</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/produk" className="hover:text-primary">Produk</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-muted">
          <div className="aspect-square">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <ImageOff className="h-16 w-16" />
              </div>
            )}
          </div>
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">{product.name}</h1>
          <p className="mt-2 text-primary">{product.description?.split(".")[0] ?? "Aneka kue tradisional pilihan"}</p>
          <div className="mt-4 font-display text-3xl font-bold text-primary">{formatRupiah(Number(product.price))}</div>
          <p className="mt-4 text-sm text-foreground/80">{product.description ?? "Berisi aneka kue tradisional terbaik dengan bahan berkualitas dan cita rasa autentik."}</p>

          <ul className="mt-6 space-y-2 text-sm">
            {["Cocok untuk berbagai acara", "100% Halal", "Fresh & dibuat setiap hari"].map((b) => (
              <li key={b} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground">✓</span>
                {b}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Jumlah</span>
            <div className="flex items-center gap-2 rounded-full border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted">
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[2ch] text-center font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">Stok: {product.stock}</span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={handleAdd}
              className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground hover:opacity-90"
            >
              <ShoppingCart className="h-4 w-4" /> Tambah ke Keranjang
            </button>
            <button
              onClick={handleBuy}
              className="rounded-full border-2 border-primary px-6 py-3 font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Beli Sekarang
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-6 rounded-2xl border border-border bg-card p-6 sm:grid-cols-3">
        {[
          { icon: Truck, title: "Pengiriman Cepat", desc: "Sampai tepat waktu" },
          { icon: Package, title: "Packing Aman", desc: "Rapi & higienis" },
          { icon: Sparkles, title: "Customer Support", desc: "Siap membantu" },
        ].map((f) => (
          <div key={f.title} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
              <f.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">{f.title}</div>
              <div className="text-xs text-muted-foreground">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
