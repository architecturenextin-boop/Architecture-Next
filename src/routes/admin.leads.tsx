import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({ meta: [{ title: "Preview Leads — Admin" }] }),
});
