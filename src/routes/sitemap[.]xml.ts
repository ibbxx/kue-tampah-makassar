import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://kuetampah.id";

/**
 * Dynamic sitemap.xml route.
 *
 * Fetches all active product slugs and published article slugs from
 * Supabase at request time and generates a valid sitemap XML.
 *
 * The `[.]` in the filename escapes the dot so TanStack Router
 * treats `/sitemap.xml` as a literal URL segment.
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Build a Supabase client from env vars available on the server
        const url = process.env.VITE_SUPABASE_URL ?? "";
        const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
        const supabase = createClient(url, key);

        // Static pages
        const staticPages = [
          { loc: "/", changefreq: "daily", priority: "1.0" },
          { loc: "/produk", changefreq: "daily", priority: "0.9" },
          { loc: "/artikel", changefreq: "weekly", priority: "0.8" },
          { loc: "/tentang", changefreq: "monthly", priority: "0.6" },
          { loc: "/kontak", changefreq: "monthly", priority: "0.6" },
        ];

        // Dynamic product pages
        const { data: products } = await supabase
          .from("products")
          .select("slug, created_at")
          .eq("is_active", true);

        const productPages = (products ?? []).map((p) => ({
          loc: `/produk/${p.slug}`,
          changefreq: "weekly" as const,
          priority: "0.8",
          lastmod: p.created_at
            ? new Date(p.created_at).toISOString().split("T")[0]
            : undefined,
        }));

        // Dynamic article pages
        const { data: articles } = await supabase
          .from("articles")
          .select("slug, created_at")
          .eq("published", true);

        const articlePages = (articles ?? []).map((a) => ({
          loc: `/artikel/${a.slug}`,
          changefreq: "monthly" as const,
          priority: "0.7",
          lastmod: a.created_at
            ? new Date(a.created_at).toISOString().split("T")[0]
            : undefined,
        }));

        const allPages = [...staticPages, ...productPages, ...articlePages];

        const urls = allPages
          .map(
            (page) => `  <url>
    <loc>${SITE_URL}${page.loc}</loc>${page.lastmod ? `\n    <lastmod>${page.lastmod}</lastmod>` : ""}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
          )
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
            "X-Robots-Tag": "noindex",
          },
        });
      },
    },
  },
});
