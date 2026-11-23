import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/dashboard/testimonials")({
  head: () => ({ meta: [{ title: "My Testimonials — ArchitectureNext" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    courseId: typeof search.courseId === "string" ? search.courseId : undefined,
  }),
});
