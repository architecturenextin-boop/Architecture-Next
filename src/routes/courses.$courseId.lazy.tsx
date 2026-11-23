import { createLazyFileRoute } from "@tanstack/react-router";
import { OG_IMAGE } from "@/lib/seo";

export const Route = createLazyFileRoute("/courses/$courseId")({
  head: () => ({
    meta: [
      { title: "Course Curriculum, Projects & Fees | ArchitectureNext" },
      {
        name: "description",
        content:
          "View the full architecture course curriculum, project briefs, software modules, fees and internship certificate details. Learn architectural drafting, 3D visualisation and AI workflows from practising architects.",
      },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },
    ],
  }),
});
