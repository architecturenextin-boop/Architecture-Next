import { createFileRoute } from "@tanstack/react-router";

interface SignupSearch {
  redirect?: string;
}

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): SignupSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Create Account — ArchitectureNext" }] }),
});
