import { Link } from "@tanstack/react-router";
import { ShoppingCart, ImageOff, ExternalLink } from "lucide-react";
import { type Product, formatRupiah } from "@/lib/supabase";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { LazyImage } from "@/components/ui/lazy-image";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const [open, setOpen] = useState(false);

  const handleAdd = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (product.stock <= 0) {
      toast.error("Stok habis");
      return;
    }
    const firstImage = product.image_url ? product.image_url.split(",")[0] : null;
    add({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: firstImage,
    });
    toast.success(`${product.name} ditambahkan ke keranjang`);
    setOpen(false); // Close the popup after adding
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:-translate-y-1 hover:shadow-lg focus:outline-none">
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            {product.image_url ? (
              <LazyImage
                src={product.image_url.split(",")[0]}
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
          <div className="flex flex-1 flex-col p-4 w-full">
            <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {product.description ?? "Kue tradisional pilihan"}
            </p>
            <div className="mt-auto flex items-center justify-between pt-3">
              <span className="font-display text-lg font-bold text-primary">
                {formatRupiah(Number(product.price))}
              </span>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdd(e);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground transition hover:opacity-90 cursor-pointer"
                aria-label="Tambah ke keranjang"
              >
                <ShoppingCart className="h-4 w-4" />
              </div>
            </div>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{product.name}</DialogTitle>
          <DialogDescription className="text-primary font-bold text-lg">
            {formatRupiah(Number(product.price))}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted relative">
            {product.image_url ? (
              <>
                <LazyImage
                  src={product.image_url.split(",")[0]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
                {product.image_url.split(",").length > 1 && (
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
                    +{product.image_url.split(",").length - 1} foto lain
                  </span>
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageOff className="h-10 w-10" />
              </div>
            )}
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {product.description ??
              "Berisi aneka kue tradisional terbaik dengan bahan berkualitas dan cita rasa autentik."}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Sisa Stok: <span className="font-medium text-foreground">{product.stock} porsi</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
          <Link
            to="/produk/$slug"
            params={{ slug: product.slug }}
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition"
          >
            <ExternalLink className="h-4 w-4" /> Detail Penuh
          </Link>
          <button
            onClick={() => handleAdd()}
            className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          >
            <ShoppingCart className="h-4 w-4" /> Tambah ke Keranjang
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
