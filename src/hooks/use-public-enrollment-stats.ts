import { useQuery } from "@tanstack/react-query";
import { courseService, type PublicEnrollmentStats } from "@/lib/services/course.service";

export function usePublicEnrollmentStats() {
  return useQuery<PublicEnrollmentStats>({
    queryKey: ["public-enrollment-stats"],
    queryFn: () => courseService.getEnrollmentStats(),
    staleTime: 60000,
    gcTime: 300000,
  });
}
