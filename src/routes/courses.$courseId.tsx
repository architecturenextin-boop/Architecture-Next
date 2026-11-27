import { createFileRoute } from "@tanstack/react-router";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";

const PAGE_TITLE = "Course Curriculum, Fees & Certification | ArchitectureNext";
const PAGE_DESCRIPTION =
  "Course curriculum, projects, fees and internship certificate. Learn drafting, 3D visualisation and AI design workflows from practising architects.";

export const Route = createFileRoute("/courses/$courseId")({
  head: ({ params }) => {
    const path = `/courses/${params.courseId}`;

    return {
      meta: [
        { title: PAGE_TITLE },
        { name: "description", content: PAGE_DESCRIPTION },
        { property: "og:title", content: PAGE_TITLE },
        { property: "og:description", content: PAGE_DESCRIPTION },
        { property: "og:url", content: SITE_URL + path },
        { property: "og:image", content: OG_IMAGE },
        { name: "twitter:image", content: OG_IMAGE },
      ],
      links: [{ rel: "canonical", href: SITE_URL + path }],
    };
  },
});
