import { apiClient } from "../api-client";
import type { Course, CourseWithContent, Progress } from "../database.types";

export interface CourseLearningData {
  course: CourseWithContent;
  isEnrolled: boolean;
  isAdmin: boolean;
  progress: Progress[];
}

export const courseService = {
  getCourses: async (): Promise<Course[]> => {
    return apiClient<Course[]>("/courses");
  },

  getCourse: async (slugOrId: string): Promise<CourseWithContent> => {
    return apiClient<CourseWithContent>(`/courses/${slugOrId}`);
  },

  getCourseLearningContent: async (slugOrId: string): Promise<CourseLearningData> => {
    return apiClient<CourseLearningData>(`/courses/${slugOrId}/learn`);
  },

  saveLessonProgress: async (
    courseId: string,
    lessonId: string,
    payload: { progress_seconds?: number; completed?: boolean }
  ): Promise<Progress> => {
    return apiClient<Progress>(`/courses/${courseId}/lessons/${lessonId}/progress`, {
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
