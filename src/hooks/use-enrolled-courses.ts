import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { dashboardService, type MyCourseProgressItem } from "@/lib/services/dashboard.service";

/**
 * Hook to retrieve the authenticated student's active course enrollments.
 * Allows buttons across the site (Landing page, Course Cards, Catalog, Headers)
 * to automatically switch from "Enroll Now" to "Continue Learning" / "Go to Course".
 */
export function useEnrolledCourses() {
  const { user } = useAuth();

  const { data: enrolledCourses = [], isLoading } = useQuery<MyCourseProgressItem[]>({
    queryKey: ["user-enrolled-courses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        return await dashboardService.getMyCourses();
      } catch {
        return [];
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const isEnrolledIn = (courseIdOrSlug?: string | null): boolean => {
    if (!courseIdOrSlug || !user || !Array.isArray(enrolledCourses)) return false;
    const target = String(courseIdOrSlug).toLowerCase().trim();
    return enrolledCourses.some((c) => {
      const cId = String(c.course_id || "").toLowerCase().trim();
      const cSlug = String(c.slug || "").toLowerCase().trim();
      return cId === target || cSlug === target;
    });
  };

  const getCourseProgress = (courseIdOrSlug?: string | null): MyCourseProgressItem | undefined => {
    if (!courseIdOrSlug || !user || !Array.isArray(enrolledCourses)) return undefined;
    const target = String(courseIdOrSlug).toLowerCase().trim();
    return enrolledCourses.find((c) => {
      const cId = String(c.course_id || "").toLowerCase().trim();
      const cSlug = String(c.slug || "").toLowerCase().trim();
      return cId === target || cSlug === target;
    });
  };

  return {
    enrolledCourses,
    hasAnyEnrollments: enrolledCourses.length > 0,
    isEnrolledIn,
    getCourseProgress,
    isLoading: !!user && isLoading,
  };
}
