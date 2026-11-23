import { createFileRoute } from "@tanstack/react-router";

interface AuthSearch {
  redirect?: string;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Sign In — ArchitectureNext" }] }),
});
