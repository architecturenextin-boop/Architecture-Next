import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/courses")({
  head: () => ({ meta: [{ title: "My Courses — ArchitectureNext" }] }),
});
