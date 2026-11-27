import { brand } from "./brand";
import { faqs } from "./static-data";

let staticHeadStripped = false;

/**
 * index.html ships a static copy of the SEO tags (title, description, OG, canonical,
 * JSON-LD) so non-JS crawlers and link previews see them before the bundle runs.
 * React hoists the route-managed copies into <head>, which would leave two of each
 * in the rendered DOM, so the static fallback carries `data-static-seo` and is
 * removed once the app mounts. Call this from the root component effect.
 */
export function stripStaticHeadFallback() {
  if (staticHeadStripped || typeof document === "undefined") return;
  staticHeadStripped = true;
  document.querySelectorAll("[data-static-seo]").forEach((tag) => tag.remove());
}

/** Canonical production origin used for SEO tags, structured data and the sitemap. */
export const SITE_URL = "https://www.architecturenext.in";
export const SITE_NAME = "ArchitectureNext";
export const OG_IMAGE = `${SITE_URL}/og-image-v2.png`;

/**
 * Brand-first title (57 chars, inside Google's ~60-char desktop snippet) and a
 * 150-char description, so the SERP snippet never truncates mid-sentence.
 * Keep index.html in sync — it ships the same two strings as a pre-JS fallback.
 */
export const SITE_TITLE = "ArchitectureNext | Architecture & Interior Design Courses";
export const SITE_DESCRIPTION =
  "Master AutoCAD, SketchUp, Photoshop & AI workflows at ArchitectureNext, Kozhikode. Hands-on architecture & interior design courses with live projects.";

export const KEYWORDS = [
  "architecture course in Kerala",
  "architecture internship Kozhikode",
  "architecture design course Kerala",
  "interior design course Kozhikode",
  "interior design training",
  "3D visualisation course",
  "3D modeling architecture",
  "2D drafting AutoCAD",
  "360 visualisation",
  "architecture presentation",
  "interactive design",
  "AATT architecture",
  "live project architecture",
  "architecture certification",
  "AI integration architecture",
  "interior design course Kerala",
  "architecture LMS",
  "SketchUp Lumion course",
  "architecture portfolio mentorship",
].join(", ");

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: "Architecture Next School of Internship",
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/icon-512.png`,
  image: OG_IMAGE,
  description: brand.description,
  email: brand.contact.email,
  telephone: brand.contact.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: "First floor, HiLITE Business Park, Palazhi",
    addressLocality: "Kozhikode",
    addressRegion: "Kerala",
    postalCode: "673014",
    addressCountry: "IN",
  },
  areaServed: "Kerala, India",
  sameAs: [
    "https://www.instagram.com/architecturenext",
    "https://www.linkedin.com/company/architecturenext",
  ],
  knowsAbout: [
    "Architecture",
    "Architectural design",
    "AI integration",
    "3D modeling",
    "2D drafting",
    "360 visualisation",
    "Architecture presentation",
    "Interactive design",
    "AATT",
    "Live projects",
    "Certifications",
    "Interior design",
    "AI design workflows",
  ],
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  description: brand.description,
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en-IN",
};

/**
 * SiteNavigationElement list: the site's primary destinations in one graph node.
 * Google uses crawlable navigation like this (plus the header/footer links) as a
 * signal when choosing sitelinks for branded searches.
 */
export const siteNavigationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Courses", url: `${SITE_URL}/courses` },
    {
      name: "AutoCAD Tools & Techniques",
      url: `${SITE_URL}/courses/AutoCADToolsandTechnique`,
    },
    {
      name: "Architecture Plan Presentation & Animation",
      url: `${SITE_URL}/courses/architecture-plan-presentation-animation`,
    },
    {
      name: "AI Master in AutoCAD, SketchUp, Photoshop",
      url: `${SITE_URL}/courses/Ai_Mater_Architecture_mcp`,
    },
  ].map((item, index) => ({
    "@type": "SiteNavigationElement",
    position: index + 1,
    name: item.name,
    url: item.url,
  })),
};

/** Minimal course fields needed for Course structured data. */
export type CourseSchemaInput = {
  title?: string | null;
  description?: string | null;
  tagline?: string | null;
  slug?: string | null;
  id?: string | null;
  price?: number | null;
  currency?: string | null;
  total_duration?: string | null;
  total_lessons?: number | null;
  thumbnail_url?: string | null;
};

/**
 * Course schema built from the real API record — no invented ratings, review
 * counts or prices. aggregateRating is deliberately omitted: the catalogue
 * currently has zero published reviews, and Google requires ratings in markup
 * to be genuine and visible on the page.
 */
export function courseJsonLd(course: CourseSchemaInput) {
  const url = `${SITE_URL}/courses/${encodeURIComponent(course.slug || course.id || "")}`;
  const price = Number(course.price ?? 0);

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title || "Architecture course",
    description: course.description || course.tagline || undefined,
    url,
    image: course.thumbnail_url || OG_IMAGE,
    inLanguage: "en-IN",
    educationalLevel: "Beginner to advanced",
    provider: {
      "@type": "EducationalOrganization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: ["online", "onsite"],
      location: {
        "@type": "Place",
        name: "ArchitectureNext, HiLITE Business Park",
        address: {
          "@type": "PostalAddress",
          streetAddress: "First floor, HiLITE Business Park, Palazhi",
          addressLocality: "Kozhikode",
          addressRegion: "Kerala",
          postalCode: "673014",
          addressCountry: "IN",
        },
      },
    },
    offers:
      price > 0
        ? {
            "@type": "Offer",
            category: "Paid",
            price,
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            url,
          }
        : undefined,
  };
}

export const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
