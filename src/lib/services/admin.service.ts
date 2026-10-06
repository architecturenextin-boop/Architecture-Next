import { apiClient, getApiConfig } from "../api-client";
import type { CourseWithContent, Coupon } from "../database.types";

export interface AdminOverviewStats {
  profileCount: number;
  enrolledStudentsCount: number;
  totalPaymentsCount: number;
  totalRevenue: number;
  courseCount: number;
  recent: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    studentName: string;
    courseTitle: string;
    orderId: string;
    created_at: string;
  }>;
}

export interface AdminStudentItem {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  username: string | null;
  phone: string | null;
  goal: string | null;
  role: "admin" | "student";
  onboarded: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  coursesCount: number;
  enrollments: Array<{
    id: string;
    status: string;
    course?: {
      id: string;
      title: string;
      price: number;
      slug: string;
    };
  }>;
}

export interface AdminPaymentItem {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  originalAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  currency: string;
  gateway: string;
  gateway_order_id: string | null;
  gateway_payment_id: string | null;
  status: string;
  paid_at: string;
  created_at: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  courseTitle: string;
  orderId: string;
  paymentId: string;
  couponCode?: string | null;
}

export const adminService = {
  getOverviewStats: async (): Promise<AdminOverviewStats> => {
    const raw = await apiClient<any>("/admin/overview");
    if (raw?.stats) {
      const recentList =
        raw.recentTransactions ||
        (raw.recentEnrollments ?? []).map((e: any) => ({
          id: e.id,
          amount: e.payment?.amount ?? e.course?.price ?? 0,
          currency: "₹",
          status: e.status ? e.status.toLowerCase() : "completed",
          studentName: e.user?.full_name || e.user?.email || "Learner",
          courseTitle: e.course?.title || "Course Access",
          orderId: e.id?.substring(0, 8).toUpperCase(),
          created_at: e.enrolled_at ?? e.created_at,
        }));

      return {
        profileCount: raw.stats.totalUsers ?? 0,
        enrolledStudentsCount: raw.stats.totalEnrollments ?? 0,
        totalPaymentsCount: raw.recentTransactions?.length ?? 0,
        totalRevenue: raw.stats.totalRevenue ?? 0,
        courseCount: raw.stats.publishedCourses ?? raw.stats.totalCourses ?? 0,
        recent: recentList.map((r: any) => ({
          id: r.id,
          amount: Number(r.finalAmount ?? r.amount ?? 0),
          currency: r.currency === "INR" || !r.currency ? "₹" : r.currency,
          status: (r.status || "completed").toLowerCase(),
          studentName: r.studentName || r.user?.full_name || r.user?.email || "Learner",
          courseTitle: r.courseTitle || r.course?.title || "Course Access",
          orderId: r.orderId || r.gateway_order_id || r.id?.substring(0, 10).toUpperCase(),
          gateway: r.gateway || "razorpay",
          created_at: r.paid_at || r.created_at || r.enrolled_at,
        })),
      };
    }
    return raw;
  },

  getAllCourses: async (): Promise<CourseWithContent[]> => {
    const res = await apiClient<{ courses: CourseWithContent[]; total: number } | CourseWithContent[]>("/admin/courses");
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).courses)) return (res as any).courses;
    return [];
  },

  upsertCourse: async (courseData: any, modulesData?: any[]): Promise<any> => {
    return apiClient("/admin/courses", {
      method: "POST",
      body: JSON.stringify({
        course: courseData,
        modules: modulesData || courseData.modules || [],
      }),
    });
  },

  deleteCourse: async (courseId: string): Promise<any> => {
    return apiClient(`/admin/courses/${courseId}`, {
      method: "DELETE",
    });
  },

  getAllStudents: async (): Promise<AdminStudentItem[]> => {
    return apiClient<AdminStudentItem[]>("/admin/students");
  },

  manualEnrollStudent: async (payload: { userId: string; courseId: string }): Promise<any> => {
    return apiClient("/admin/students/enroll", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  revokeStudentEnrollment: async (payload: { userId: string; courseId?: string; enrollmentId?: string }): Promise<any> => {
    return apiClient("/admin/students/revoke-enrollment", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateStudentRole: async (userId: string, role: "admin" | "student"): Promise<any> => {
    return apiClient(`/admin/students/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  },

  getAllPayments: async (): Promise<AdminPaymentItem[]> => {
    return apiClient<AdminPaymentItem[]>("/admin/payments");
  },

  getPresignedUploadUrl: async (
    payload: { filename: string; contentType?: string; folder?: string },
    timeoutMs = 3000
  ) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await apiClient<{
        uploadUrl: string;
        key: string;
        filename: string;
        publicUrl: string | null;
        mediaUrl: string;
        videoUrl: string;
        videoPath: string;
      }>("/admin/r2/presigned-url", {
        method: "POST",
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  },

  uploadVideo: async (
    file: File,
    onProgress?: (progress: { percent: number; loaded: number; total: number; stage?: string }) => void,
    abortSignalRef?: { abort?: () => void }
  ): Promise<{ filename: string; originalName: string; size: number; videoUrl: string; videoPath: string }> => {
    onProgress?.({ percent: 0, loaded: 0, total: file.size, stage: "Checking storage endpoint..." });

    // 1. Try direct Cloudflare R2 Presigned Upload if configured
    try {
      const presigned = await adminService.getPresignedUploadUrl({
        filename: file.name,
        contentType: file.type || "video/mp4",
        folder: "videos",
      });

      if (presigned && presigned.uploadUrl) {
        onProgress?.({ percent: 0, loaded: 0, total: file.size, stage: "Uploading directly to Cloudflare R2..." });
        return await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          if (abortSignalRef) {
            abortSignalRef.abort = () => {
              xhr.abort();
              reject(new Error("Upload cancelled by user"));
            };
          }
          xhr.open("PUT", presigned.uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

          if (xhr.upload) {
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
                onProgress?.({
                  percent,
                  loaded: event.loaded,
                  total: event.total,
                  stage: percent >= 99 ? "Finalizing upload..." : "Uploading directly to storage...",
                });
              }
            };
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              onProgress?.({ percent: 100, loaded: file.size, total: file.size, stage: "Upload complete!" });
              resolve({
                filename: presigned.filename,
                originalName: file.name,
                size: file.size,
                videoUrl: presigned.videoUrl,
                videoPath: presigned.videoPath,
              });
            } else {
              reject(new Error(`Direct R2 upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => {
            reject(new Error("Network error during direct Cloudflare R2 upload"));
          };

          xhr.send(file);
        });
      }
    } catch (_) {
      // Fallback to standard multipart upload
    }

    onProgress?.({ percent: 0, loaded: 0, total: file.size, stage: "Uploading video to server..." });

    const formData = new FormData();
    formData.append("video", file);

    const { url, headers } = getApiConfig("/admin/upload-video");

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      if (abortSignalRef) {
        abortSignalRef.abort = () => {
          xhr.abort();
          reject(new Error("Upload cancelled by user"));
        };
      }
      xhr.open("POST", url);
      xhr.withCredentials = true;
      
      Object.entries(headers).forEach(([key, val]) => {
        xhr.setRequestHeader(key, val);
      });

      if (xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
            onProgress?.({
              percent,
              loaded: event.loaded,
              total: event.total,
              stage: percent >= 99 ? "Processing on server..." : "Uploading video...",
            });
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            onProgress?.({ percent: 100, loaded: file.size, total: file.size, stage: "Upload complete!" });
            resolve(res.data);
          } catch {
            reject(new Error("Invalid JSON response from server"));
          }
        } else {
          try {
            const res = JSON.parse(xhr.responseText);
            reject(new Error(res.message || res.error || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during video upload. Please check your connection."));
      };

      xhr.send(formData);
    });
  },

  uploadImage: async (file: File): Promise<{ filename: string; imageUrl: string; imagePath: string }> => {
    const formData = new FormData();
    formData.append("image", file);

    const { url, headers } = getApiConfig("/admin/upload-image");

    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers,
      body: formData,
    });

    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.message || json.error || "Failed to upload image");
    }
    return json.data;
  },

  uploadDocument: async (
    file: File,
    onProgress?: (progress: { percent: number; loaded: number; total: number; stage?: string }) => void,
    abortSignalRef?: { abort?: () => void }
  ): Promise<{ filename: string; originalName: string; size: number; documentUrl: string; documentPath: string }> => {
    onProgress?.({ percent: 0, loaded: 0, total: file.size, stage: "Preparing document upload..." });

    const formData = new FormData();
    formData.append("document", file);

    const { url, headers } = getApiConfig("/admin/upload-document");

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      if (abortSignalRef) {
        abortSignalRef.abort = () => {
          xhr.abort();
          reject(new Error("Upload cancelled by user"));
        };
      }
      xhr.open("POST", url);
      xhr.withCredentials = true;
      
      Object.entries(headers).forEach(([key, val]) => {
        xhr.setRequestHeader(key, val);
      });

      if (xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
            onProgress?.({
              percent,
              loaded: event.loaded,
              total: event.total,
              stage: percent >= 99 ? "Processing document..." : "Uploading document...",
            });
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            onProgress?.({ percent: 100, loaded: file.size, total: file.size, stage: "Upload complete!" });
            resolve(res.data);
          } catch {
            reject(new Error("Invalid JSON response from server"));
          }
        } else {
          try {
            const res = JSON.parse(xhr.responseText);
            reject(new Error(res.message || res.error || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during document upload"));
      };

      xhr.send(formData);
    });
  },

  // Coupon Management
  getAllCoupons: async (): Promise<Coupon[]> => {
    return apiClient<Coupon[]>("/admin/coupons");
  },

  createCoupon: async (payload: {
    code: string;
    discountType: "FLAT" | "PERCENT";
    discountValue: number;
    maxDiscount?: number | null;
    courseId?: string | null;
    expiresAt?: string | null;
    usageLimit?: number | null;
    perUserLimit?: number;
    isActive?: boolean;
  }): Promise<Coupon> => {
    return apiClient<Coupon>("/admin/coupons", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateCoupon: async (
    id: string,
    payload: {
      code?: string;
      discountType?: "FLAT" | "PERCENT";
      discountValue?: number;
      maxDiscount?: number | null;
      courseId?: string | null;
      expiresAt?: string | null;
      usageLimit?: number | null;
      perUserLimit?: number;
      isActive?: boolean;
    }
  ): Promise<Coupon> => {
    return apiClient<Coupon>(`/admin/coupons/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  toggleCoupon: async (id: string): Promise<Coupon> => {
    return apiClient<Coupon>(`/admin/coupons/${id}/toggle`, {
      method: "PATCH",
    });
  },

  deleteCoupon: async (
    id: string
  ): Promise<{ deactivated?: boolean; deleted?: boolean; message: string }> => {
    return apiClient(`/admin/coupons/${id}`, {
      method: "DELETE",
    });
  },
};

