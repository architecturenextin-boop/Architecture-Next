import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/courses")({
  head: () => ({ meta: [{ title: "Courses — Admin" }] }),
});
