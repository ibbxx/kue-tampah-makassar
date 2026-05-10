import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ImageOff } from "lucide-react";
import { supabase, type Article } from "@/lib/supabase";
import { SITE_CONFIG } from "@/lib/constants";

export const Route = createFileRoute("/_site/artikel")({
  head: () => ({
    meta: [
      { title: `Artikel — ${SITE_CONFIG.name}` },
      { name: "description", content: `Tips, cerita, dan informasi seputar kue tradisional ${SITE_CONFIG.city}.` },
      { property: "og:title", content: `Artikel ${SITE_CONFIG.name}` },
      { property: "og:description", content: "Edukasi seputar kue tradisional & paket acara." },
    ],
  }),
  component: ArticlesPage,
});

function ArticlesPage() {
  const { data: articles } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      return (data ?? []) as Article[];
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 pt-32 pb-12 md:px-8">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold text-primary">Artikel & Cerita</h1>
        <p className="mt-2 text-muted-foreground">Inspirasi kue tradisional & tips suguhan acara</p>
      </div>

      {articles && articles.length > 0 ? (
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {articles.map((a) => (
            <Link
              key={a.id}
              to="/artikel/$slug"
              params={{ slug: a.slug }}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="aspect-video overflow-hidden bg-muted">
                {a.cover_url ? (
                  <img src={a.cover_url} alt={a.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="h-10 w-10" /></div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  {new Date(a.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-foreground group-hover:text-primary">{a.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{a.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          Belum ada artikel. Pantau terus halaman ini untuk update terbaru.
        </div>
      )}
    </div>
  );
}
