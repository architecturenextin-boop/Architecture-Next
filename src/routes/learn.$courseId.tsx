import { createFileRoute, redirect, isRedirect } from "@tanstack/react-router";
import { courseService } from "@/lib/services/course.service";
import { tokenStorage } from "@/lib/api-client";

export const Route = createFileRoute("/learn/$courseId")({
  validateSearch: (search: Record<string, unknown>) => ({
    lessonId: typeof search.lessonId === "string" ? search.lessonId : undefined,
  }),
  head: () => ({ meta: [{ title: "Learning — ArchitectureNext" }] }),
  beforeLoad: async ({ params }) => {
    const token = tokenStorage.get();
    if (!token) {
      throw redirect({ to: "/auth" });
    }

    try {
      const data = await courseService.getCourseLearningContent(params.courseId);
      if (!data.isEnrolled && !data.isAdmin) {
        throw redirect({ to: "/checkout", search: { course: params.courseId } });
      }
    } catch (err: any) {
      if (isRedirect(err)) throw err;
      if (err.statusCode === 401) {
        tokenStorage.clear();
        throw redirect({ to: "/auth" });
      }
    }
  },
});
