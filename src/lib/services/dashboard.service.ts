import { apiClient } from "../api-client";

export interface MyCourseProgressItem {
  course_id: string;
  slug: string;
  title: string;
  tagline: string | null;
  cover_url: string | null;
  total_lessons: number;
  total_duration: string | null;
  level: string | null;
  currency: string;
  price: number;
  progress_count: number;
  last_watched_lesson_id: string | null;
  last_watched_lesson_title: string | null;
  enrolled_at: string;
}

export interface MyPurchaseItem {
  id: string;
  user_id: string;
  course_id: string;
  course_title: string;
  course_slug: string;
  cover_url: string;
  amount: number;
  currency: string;
  gateway: string;
  gateway_order_id: string | null;
  gateway_payment_id: string | null;
  status: string;
  paid_at: string;
  created_at: string;
}

export const dashboardService = {
  getMyCourses: async (): Promise<MyCourseProgressItem[]> => {
    return apiClient<MyCourseProgressItem[]>("/dashboard/courses");
  },

  getMyPurchases: async (): Promise<MyPurchaseItem[]> => {
    return apiClient<MyPurchaseItem[]>("/dashboard/purchases");
  },
};
