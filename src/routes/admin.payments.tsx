import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "Payments & Revenue — Admin" }] }),
});
