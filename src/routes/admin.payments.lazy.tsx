import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "Payments & Revenue — Admin" }] }),
});
