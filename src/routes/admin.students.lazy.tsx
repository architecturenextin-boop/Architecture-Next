import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "Students Management — Admin" }] }),
});
