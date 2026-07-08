import { SITE_CONFIG } from "./constants";

/**
 * SEO helper utilities for generating consistent meta tags and structured data
 * across all pages of the Kue Tampah Ratulangi website.
 */

type SeoOptions = {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  noIndex?: boolean;
};

/**
 * Generates a consistent set of meta tags for the TanStack Router `head` config.
 * Child routes override the parent's meta arrays, so we include all required
 * tags (viewport, charset, etc.) in every page.
 */
export function seoMeta(opts: SeoOptions) {
  const url = `${SITE_CONFIG.url}${opts.path}`;
  const fullTitle = `${opts.title} — ${SITE_CONFIG.name}`;

  const meta: Array<Record<string, string>> = [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { title: fullTitle },
    { name: "description", content: opts.description },
    { name: "author", content: SITE_CONFIG.name },

    // Robots
    ...(opts.noIndex
      ? [{ name: "robots", content: "noindex, nofollow" }]
      : [{ name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" }]),

    // Open Graph
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: opts.description },
    { property: "og:url", content: url },
    { property: "og:site_name", content: SITE_CONFIG.name },
    { property: "og:type", content: opts.ogType ?? "website" },
    { property: "og:locale", content: "id_ID" },
    ...(opts.ogImage ? [{ property: "og:image", content: opts.ogImage }] : []),

    // Twitter Card
    { name: "twitter:card", content: opts.ogImage ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: opts.description },
    ...(opts.ogImage ? [{ name: "twitter:image", content: opts.ogImage }] : []),
  ];

  const links: Array<Record<string, string>> = [
    { rel: "canonical", href: url },
  ];

  return { meta, links };
}

/* ------------------------------------------------------------------ */
/*  JSON-LD Structured Data helpers                                    */
/* ------------------------------------------------------------------ */

/**
 * Returns a JSON-LD script element as a React-compatible object.
 * Usage: <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
 */

export function localBusinessJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.shortName,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    telephone: `+${SITE_CONFIG.whatsapp}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jl. DR. Ratulangi",
      addressLocality: "Makassar",
      addressRegion: "Sulawesi Selatan",
      postalCode: "90125",
      addressCountry: "ID",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -5.1477,
      longitude: 119.4327,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "06:00",
      closes: "20:00",
    },
    priceRange: "Rp",
    servesCuisine: ["Kue Tradisional", "Jajanan Pasar", "Kue Makassar"],
    image: `${SITE_CONFIG.url}/logo.png`,
    logo: `${SITE_CONFIG.url}/logo.png`,
    sameAs: [SITE_CONFIG.instagramUrl],
    areaServed: {
      "@type": "City",
      name: "Makassar",
    },
  });
}

export function productJsonLd(product: {
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
}) {
  const images = product.image_url
    ? product.image_url.split(",").filter(Boolean)
    : [`${SITE_CONFIG.url}/logo.png`];

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description ?? `${product.name} — kue tradisional khas Makassar`,
    url: `${SITE_CONFIG.url}/produk/${product.slug}`,
    image: images,
    brand: {
      "@type": "Brand",
      name: SITE_CONFIG.name,
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_CONFIG.url}/produk/${product.slug}`,
      priceCurrency: "IDR",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: SITE_CONFIG.name,
      },
    },
  });
}

export function articleJsonLd(article: {
  title: string;
  slug: string;
  excerpt: string | null;
  cover_url: string | null;
  created_at: string;
}) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt ?? article.title,
    url: `${SITE_CONFIG.url}/artikel/${article.slug}`,
    image: article.cover_url ?? `${SITE_CONFIG.url}/logo.png`,
    datePublished: article.created_at,
    author: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_CONFIG.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_CONFIG.url}/artikel/${article.slug}`,
    },
  });
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_CONFIG.url}${item.path}`,
    })),
  });
}

export function faqJsonLd(faqs: Array<{ q: string; a: string }>) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  });
}

/** WebSite schema with SearchAction for sitelinks search box */
export function webSiteJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.shortName,
    url: SITE_CONFIG.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_CONFIG.url}/produk?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  });
}
