import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { supabase, type Product, type Category } from "@/lib/supabase";
import { ProductCard } from "@/components/site/ProductCard";

const search = z.object({
  q: z.string().optional(),
  kategori: z.string().optional(),
});

export const Route = createFileRoute("/_site/produk")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Produk — Kue Tampah Ratulangi" },
      { name: "description", content: "Katalog kue tampah, jajanan pasar, dan paket suguhan acara." },
      { property: "og:title", content: "Produk Kue Tampah" },
      { property: "og:description", content: "Pilih kue tampah favorit Anda." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { q, kategori } = Route.useSearch();
  const navigate = useNavigate({ from: "/produk" });
  const [query, setQuery] = useState(q ?? "");

  const { data: products } = useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false });
      return (data ?? []) as Product[];
    },
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*");
      return (data ?? []) as Category[];
    },
  });

  const filtered = useMemo(() => {
    let list = products ?? [];
    if (kategori) {
      const cat = (categories ?? []).find((c) => c.slug === kategori);
      if (cat) list = list.filter((p) => p.category_id === cat.id);
    }
    if (q) {
      const t = q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(t) || (p.description ?? "").toLowerCase().includes(t));
    }
    return list;
  }, [products, categories, q, kategori]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold text-primary">Produk Kami</h1>
        <p className="mt-2 text-muted-foreground">Temukan aneka kue tampah terbaik untuk setiap momen spesial Anda.</p>
      </div>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ search: (prev: { q?: string; kategori?: string }) => ({ ...prev, q: query || undefined }) });
          }}
          className="relative w-full md:max-w-md"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari kue tampah..."
            className="h-11 w-full rounded-full border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </form>

        <div className="flex flex-wrap gap-2">
          <FilterPill active={!kategori} onClick={() => navigate({ search: (prev: { q?: string; kategori?: string }) => ({ ...prev, kategori: undefined }) })}>
            Semua
          </FilterPill>
          {(categories ?? []).map((c) => (
            <FilterPill
              key={c.id}
              active={kategori === c.slug}
              onClick={() => navigate({ search: (prev: { q?: string; kategori?: string }) => ({ ...prev, kategori: c.slug }) })}
            >
              {c.name}
            </FilterPill>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          {products && products.length > 0
            ? "Tidak ada produk yang cocok dengan pencarian Anda."
            : "Belum ada produk. Admin sedang menyiapkan menu terbaik."}
          <div className="mt-4">
            <Link to="/" className="text-sm font-semibold text-primary hover:underline">← Kembali ke beranda</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPill({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground/80 hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}
