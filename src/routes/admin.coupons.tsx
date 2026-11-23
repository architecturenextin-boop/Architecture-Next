import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({ meta: [{ title: "Coupons & Discounts — Admin" }] }),
});
