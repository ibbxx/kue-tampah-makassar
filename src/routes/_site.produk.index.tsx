import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { supabase, type Product, type Category } from "@/lib/supabase";
import { ProductCard } from "@/components/site/ProductCard";
import { SITE_CONFIG } from "@/lib/constants";

const search = z.object({
  q: z.string().optional(),
  kategori: z.string().optional(),
});

export const Route = createFileRoute("/_site/produk/")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: `Produk — ${SITE_CONFIG.name}` },
      {
        name: "description",
        content: `Katalog lengkap kue tampah, jajanan pasar, dan suguhan acara khas ${SITE_CONFIG.city}.`,
      },
      { property: "og:title", content: "Produk Kue Tampah" },
      { property: "og:description", content: "Pilih kue tampah favorit Anda." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { q, kategori } = Route.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState(q ?? "");

  const { data: products } = useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
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
    if (query) {
      const t = query.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(t) || (p.description ?? "").toLowerCase().includes(t),
      );
    }
    return list;
  }, [products, categories, query, kategori]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-32 pb-12 md:px-8">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold text-primary">Produk Kami</h1>
        <p className="mt-2 text-muted-foreground">
          Temukan aneka kue tampah terbaik untuk setiap momen spesial Anda.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({
              to: "/produk",
              search: {
                q: query || undefined,
                kategori: kategori || undefined,
              },
              replace: true,
            });
          }}
          className="group relative w-full md:max-w-md"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-all duration-300 group-focus-within:scale-110 group-focus-within:text-primary" />
          <input
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              navigate({
                to: "/produk",
                search: {
                  q: val || undefined,
                  kategori: kategori || undefined,
                },
                replace: true,
              });
            }}
            placeholder="Cari kue tampah..."
            className="peer h-11 w-full rounded-full border border-border bg-background pl-10 pr-4 text-sm outline-none transition-all duration-300 focus:border-primary focus:shadow-[0_0_15px_rgba(var(--primary),0.2)] focus:ring-2 focus:ring-primary/20"
          />
        </form>

        <div className="flex flex-wrap gap-2">
          <FilterPill
            active={!kategori}
            onClick={() =>
              navigate({
                to: "/produk",
                search: {
                  q: query || undefined,
                  kategori: undefined,
                },
                replace: true,
              })
            }
          >
            Semua
          </FilterPill>
          {(categories ?? []).map((c) => (
            <FilterPill
              key={c.id}
              active={kategori === c.slug}
              onClick={() =>
                navigate({
                  to: "/produk",
                  search: {
                    q: query || undefined,
                    kategori: c.slug,
                  },
                  replace: true,
                })
              }
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
            <Link to="/" className="text-sm font-semibold text-primary hover:underline">
              ← Kembali ke beranda
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden rounded-full border px-5 py-2 text-sm font-medium transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md active:translate-y-0 active:scale-95 ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30 ring-offset-1 ring-offset-background"
          : "border-border bg-background text-foreground/70 hover:border-primary/50 hover:text-foreground"
      }`}
    >
      <span className="relative z-10 pointer-events-none">{children}</span>
      {active && (
        <span className="absolute inset-0 -z-10 animate-[pulse_2s_ease-in-out_infinite] bg-white/10 blur-sm pointer-events-none" />
      )}
    </button>
  );
}
