import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronRight } from "lucide-react";
import { supabase, type Article } from "@/lib/supabase";
import { LazyImage } from "@/components/ui/lazy-image";

export const Route = createFileRoute("/_site/artikel/$slug")({
  component: ArticleDetail,
});

function ArticleDetail() {
  const { slug } = Route.useParams();
  const { data: article, isLoading } = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data } = await supabase.from("articles").select("*").eq("slug", slug).maybeSingle();
      return data as Article | null;
    },
  });

  if (isLoading)
    return <div className="pt-32 pb-20 text-center text-muted-foreground">Memuat...</div>;
  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-32 pb-20 text-center">
        <h1 className="font-display text-3xl">Artikel tidak ditemukan</h1>
        <Link to="/artikel" className="mt-4 inline-block text-primary hover:underline">
          ← Kembali
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 pt-32 pb-12 md:px-8">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">
          Beranda
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/artikel" className="hover:text-primary">
          Artikel
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="line-clamp-1 text-foreground">{article.title}</span>
      </nav>

      <h1 className="mt-6 font-display text-4xl font-bold text-foreground md:text-5xl">
        {article.title}
      </h1>
      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4" />
        {new Date(article.created_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>

      {article.cover_url && (
        <div className="mt-6 overflow-hidden rounded-2xl">
          <LazyImage src={article.cover_url} alt={article.title} className="w-full object-cover" />
        </div>
      )}

      {article.excerpt && <p className="mt-6 text-lg text-muted-foreground">{article.excerpt}</p>}
      <div className="prose prose-neutral mt-6 max-w-none whitespace-pre-wrap text-foreground/85">
        {article.content}
      </div>
    </article>
  );
}
