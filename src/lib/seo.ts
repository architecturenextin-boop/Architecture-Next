import { brand } from "./brand";
import { faqs } from "./static-data";

/** Canonical production origin used for SEO tags, structured data and the sitemap. */
export const SITE_URL = "https://www.architecturenext.in";
export const SITE_NAME = "ArchitectureNext";
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const KEYWORDS = [
  "architecture course in Kerala",
  "architecture internship Kozhikode",
  "architecture design course Kerala",
  "interior design training",
  "3D visualisation course",
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
  knowsAbout: [
    "Architecture",
    "Architectural design",
    "3D visualisation",
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
