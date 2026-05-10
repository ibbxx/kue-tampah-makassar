import { Link } from "@tanstack/react-router";
import { ShoppingCart, ImageOff } from "lucide-react";
import { type Product, formatRupiah } from "@/lib/supabase";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) {
      toast.error("Stok habis");
      return;
    }
    add({ productId: product.id, name: product.name, price: Number(product.price), image: product.image_url });
    toast.success(`${product.name} ditambahkan ke keranjang`);
  };

  return (
    <Link
      to="/produk/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
        {product.badge && (
          <span
            className={cn(
              "absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-bold uppercase text-primary-foreground",
              product.badge.toLowerCase().includes("baru") ? "bg-accent" : "bg-primary",
            )}
          >
            {product.badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {product.description ?? "Kue tradisional pilihan"}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-display text-lg font-bold text-primary">{formatRupiah(Number(product.price))}</span>
          <button
            onClick={handleAdd}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground transition hover:opacity-90"
            aria-label="Tambah ke keranjang"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
