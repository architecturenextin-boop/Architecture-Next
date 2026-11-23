import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — ArchitectureNext" }] }),
});
