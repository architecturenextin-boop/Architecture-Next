import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "Students Management — Admin" }] }),
});
