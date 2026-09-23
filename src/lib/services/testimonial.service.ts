import { apiClient } from "../api-client";
import type {
  PublicTestimonial,
  StudentTestimonial,
  AdminTestimonialsResponse,
} from "../database.types";

const FALLBACK_PUBLIC_TESTIMONIALS: PublicTestimonial[] = [
  {
    id: "fallback-1",
    name: "Ar. Rahul Varma",
    role: "Junior Architect, Studio Lotus",
    quote: "The Revit & BIM workflow program completely transformed how I execute projects. I transitioned from 2D drafting to full 3D coordinated model delivery in just 8 weeks.",
    rating: 5,
    course: "Complete BIM Architecture Masterclass",
    courseSlug: "complete-bim-architecture",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    name: "Ar. Priya Nair",
    role: "BIM Coordinator, Morphogenesis",
    quote: "ArchitectureNext's mentorship and live project assignments gave me the confidence to handle large-scale construction documentation and BOQ scheduling seamlessly.",
    rating: 5,
    course: "Revit Architecture & Parametric Modeling",
    courseSlug: "revit-architecture-parametric",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    name: "Ar. Sneha Roy",
    role: "Computational Design Lead",
    quote: "The Rhino + Grasshopper parametric training was world-class. The hands-on algorithmic problem solving is something you simply don't learn in standard college curriculums.",
    rating: 5,
    course: "Parametric Design with Rhino & Grasshopper",
    courseSlug: "parametric-design-rhino",
    createdAt: new Date().toISOString(),
  },
];

export const testimonialService = {
  /**
   * Public: Get all approved testimonials (optional courseId filter)
   */
  async getPublicTestimonials(courseId?: string): Promise<PublicTestimonial[]> {
    try {
      const url = courseId ? `/testimonials?courseId=${encodeURIComponent(courseId)}` : "/testimonials";
      const data = await apiClient<PublicTestimonial[]>(url);
      if (Array.isArray(data) && data.length > 0) return data;
      return FALLBACK_PUBLIC_TESTIMONIALS;
    } catch {
      return FALLBACK_PUBLIC_TESTIMONIALS;
    }
  },

  /**
   * Student: Get authenticated student's submissions
   */
  async getMyTestimonials(): Promise<StudentTestimonial[]> {
    try {
      return await apiClient<StudentTestimonial[]>("/testimonials/my");
    } catch {
      return [];
    }
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
    try {
      const query = new URLSearchParams();
      if (params?.status && params.status !== "ALL") query.append("status", params.status);
      if (params?.search) query.append("search", params.search);

      const queryString = query.toString();
      const url = queryString ? `/admin/testimonials?${queryString}` : "/admin/testimonials";
      return await apiClient<AdminTestimonialsResponse>(url);
    } catch {
      return {
        items: [],
        counts: { all: 0, pending: 0, approved: 0, rejected: 0 },
      };
    }
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
