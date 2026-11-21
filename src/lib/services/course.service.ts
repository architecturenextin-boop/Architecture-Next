import { apiClient } from "../api-client";
import type { Course, CourseWithContent, Progress } from "../database.types";

export interface CourseLearningData {
  course: CourseWithContent;
  isEnrolled: boolean;
  isAdmin: boolean;
  progress: Progress[];
}

export interface LessonProgressPayload {
  progress_seconds?: number;
  last_position?: number;
  lastPosition?: number;
  duration?: number;
  completed?: boolean;
}

export interface PublicEnrollmentStats {
  count: number;
  activeCount?: number;
  totalRegisteredCount?: number;
  recentStudents: string[];
  latestStudent: string;
}

export const courseService = {
  getCourses: async (): Promise<Course[]> => {
    return apiClient<Course[]>("/courses");
  },

  getEnrollmentCount: async (): Promise<number> => {
    try {
      const res = await apiClient<any>("/courses/stats/enrollment-count");
      const num = typeof res === "number" ? res : (typeof res?.totalRegisteredCount === "number" ? res.totalRegisteredCount : (typeof res?.activeCount === "number" ? res.activeCount : (typeof res?.count === "number" ? res.count : null)));
      if (num !== null) {
        return num;
      }
      return 96;
    } catch {
      return 96;
    }
  },

  getEnrollmentStats: async (): Promise<PublicEnrollmentStats> => {
    try {
      const res = await apiClient<any>("/courses/stats/enrollment-count");
      const rawCount = res?.totalRegisteredCount || res?.activeCount || (typeof res === "number" ? res : res?.count) || 96;
      const recentStudents = Array.isArray(res?.recentStudents) && res.recentStudents.length > 0
        ? res.recentStudents
        : ["Dini", "Ramees", "Malu", "Ansar", "Shahul", "Imayavarman", "Viswa"];
      const latestStudent = res?.latestStudent || recentStudents[0] || "Dini";

      return {
        count: rawCount,
        activeCount: rawCount,
        totalRegisteredCount: rawCount,
        recentStudents,
        latestStudent,
      };
    } catch {
      return {
        count: 96,
        activeCount: 96,
        totalRegisteredCount: 96,
        recentStudents: ["Dini", "Ramees", "Malu", "Ansar", "Shahul", "Imayavarman", "Viswa"],
        latestStudent: "Dini",
      };
    }
  },

  getCourse: async (slugOrId: string): Promise<CourseWithContent> => {
    return apiClient<CourseWithContent>(`/courses/${slugOrId}`);
  },

  getCourseLearningContent: async (slugOrId: string): Promise<CourseLearningData> => {
    const cacheKey = `skillspring_course_learn_${slugOrId}`;
    try {
      const data = await apiClient<CourseLearningData>(`/courses/${slugOrId}/learn`);
      if (typeof window !== "undefined" && data) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (_) {}
      }
      return data;
    } catch (err: any) {
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            return JSON.parse(cached);
          }
        } catch (_) {}
      }
      throw err;
    }
  },

  getLessonProgress: async (lessonId: string): Promise<Progress> => {
    return apiClient<Progress>(`/lessons/${lessonId}/progress`);
  },

  saveLessonProgress: async (
    courseId: string | null | undefined,
    lessonId: string,
    payload: LessonProgressPayload
  ): Promise<Progress> => {
    const endpoint = courseId 
      ? `/courses/${courseId}/lessons/${lessonId}/progress`
      : `/lessons/${lessonId}/progress`;

    return apiClient<Progress>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  removeLessonProgress: async (courseId: string, lessonId: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>(`/courses/${courseId}/lessons/${lessonId}/progress`, {
      method: "DELETE",
    });
  },
};

