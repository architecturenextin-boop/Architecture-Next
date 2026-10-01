import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/downloads")({
  head: () => ({ meta: [{ title: "Offline Downloads — ArchitectureNext" }] }),
});