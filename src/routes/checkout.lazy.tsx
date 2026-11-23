import { createLazyFileRoute } from "@tanstack/react-router";
import { tokenStorage } from "@/lib/api-client";

export const Route = createLazyFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    course: typeof search.course === "string" ? search.course : undefined,
  }),
  head: () => ({ meta: [{ title: "Secure Checkout — ArchitectureNext" }] }),
  beforeLoad: ({ search }) => {
    const token = tokenStorage.get();
    if (!token) {
      const params = new URLSearchParams();
      if (search.course) params.set("course", search.course);
      const query = params.toString();
      throw redirect({
        to: "/auth",
        search: { redirect: `/checkout${query ? `?${query}` : ""}` },
      });
    }
  },
});
