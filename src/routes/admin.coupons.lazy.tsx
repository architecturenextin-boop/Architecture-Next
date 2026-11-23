import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/admin/coupons")({
  head: () => ({ meta: [{ title: "Coupons & Discounts — Admin" }] }),
});
