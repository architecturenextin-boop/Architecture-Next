import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/admin/testimonials")({
  head: () => ({ meta: [{ title: "Testimonials Management — Admin" }] }),
});
