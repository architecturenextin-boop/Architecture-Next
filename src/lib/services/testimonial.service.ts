import { apiClient } from "../api-client";
import type {
  PublicTestimonial,
  StudentTestimonial,
  AdminTestimonialsResponse,
} from "../database.types";

export const testimonialService = {
  /**
   * Public: Get all approved testimonials (optional courseId filter)
   */
  async getPublicTestimonials(courseId?: string): Promise<PublicTestimonial[]> {
    const url = courseId ? `/testimonials?courseId=${encodeURIComponent(courseId)}` : "/testimonials";
    return apiClient<PublicTestimonial[]>(url);
  },

  /**
   * Student: Get authenticated student's submissions
   */
  async getMyTestimonials(): Promise<StudentTestimonial[]> {
    return apiClient<StudentTestimonial[]>("/testimonials/my");
  },

  /**
   * Student: Submit a new testimonial
   */
  async submitTestimonial(payload: {
    quote: string;
    rating: number;
    courseId?: string | null;
  }): Promise<StudentTestimonial> {
    return apiClient<StudentTestimonial>("/testimonials", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Student: Delete own testimonial
   */
  async deleteMyTestimonial(id: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/testimonials/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Admin: List testimonials with filters & counts
   */
  async getAdminTestimonials(params?: {
    status?: string;
    search?: string;
  }): Promise<AdminTestimonialsResponse> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "ALL") query.append("status", params.status);
    if (params?.search) query.append("search", params.search);

    const queryString = query.toString();
    const url = queryString ? `/admin/testimonials?${queryString}` : "/admin/testimonials";
    return apiClient<AdminTestimonialsResponse>(url);
  },

  /**
   * Admin: Approve a testimonial
   */
  async approveTestimonial(id: string): Promise<any> {
    return apiClient<any>(`/admin/testimonials/${id}/approve`, {
      method: "PATCH",
    });
  },

  /**
   * Admin: Reject a testimonial with optional admin note
   */
  async rejectTestimonial(id: string, adminNote?: string): Promise<any> {
    return apiClient<any>(`/admin/testimonials/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ adminNote }),
    });
  },

  /**
   * Admin: Delete a testimonial
   */
  async deleteAdminTestimonial(id: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/admin/testimonials/${id}`, {
      method: "DELETE",
    });
  },
};
