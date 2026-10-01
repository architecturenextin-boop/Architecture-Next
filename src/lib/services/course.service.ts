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

