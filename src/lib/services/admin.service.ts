import { apiClient, getApiConfig } from "../api-client";
import type { CourseWithContent } from "../database.types";

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
}

export const adminService = {
  getOverviewStats: async (): Promise<AdminOverviewStats> => {
    return apiClient<AdminOverviewStats>("/admin/overview");
  },

  getAllCourses: async (): Promise<CourseWithContent[]> => {
    return apiClient<CourseWithContent[]>("/admin/courses");
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

  updateStudentRole: async (userId: string, role: "admin" | "student"): Promise<any> => {
    return apiClient(`/admin/students/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  },

  getAllPayments: async (): Promise<AdminPaymentItem[]> => {
    return apiClient<AdminPaymentItem[]>("/admin/payments");
  },

  getPresignedUploadUrl: async (payload: { filename: string; contentType?: string; folder?: string }) => {
    return apiClient<{
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
    });
  },

  uploadVideo: async (
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ filename: string; originalName: string; size: number; videoUrl: string; videoPath: string }> => {
    // 1. Try direct Cloudflare R2 Presigned Upload if configured
    try {
      const presigned = await adminService.getPresignedUploadUrl({
        filename: file.name,
        contentType: file.type || "video/mp4",
        folder: "videos",
      });

      if (presigned && presigned.uploadUrl) {
        return await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presigned.uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

          if (xhr.upload && onProgress) {
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress(percent);
              }
            };
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
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

    const formData = new FormData();
    formData.append("video", file);

    const { url, headers } = getApiConfig("/admin/upload-video");

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.withCredentials = true;
      
      Object.entries(headers).forEach(([key, val]) => {
        xhr.setRequestHeader(key, val);
      });

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            resolve(res.data);
          } catch {
            reject(new Error("Invalid JSON response from server"));
          }
        } else {
          try {
            const res = JSON.parse(xhr.responseText);
            reject(new Error(res.message || res.error || "Upload failed"));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during video upload"));
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
    onProgress?: (percent: number) => void
  ): Promise<{ filename: string; originalName: string; size: number; documentUrl: string; documentPath: string }> => {
    const formData = new FormData();
    formData.append("document", file);

    const { url, headers } = getApiConfig("/admin/upload-document");

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.withCredentials = true;
      
      Object.entries(headers).forEach(([key, val]) => {
        xhr.setRequestHeader(key, val);
      });

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            resolve(res.data);
          } catch {
            reject(new Error("Invalid JSON response from server"));
          }
        } else {
          try {
            const res = JSON.parse(xhr.responseText);
            reject(new Error(res.message || res.error || "Upload failed"));
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
};
