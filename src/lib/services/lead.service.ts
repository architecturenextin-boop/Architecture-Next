import { apiClient } from "../api-client";

export interface LeadItem {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  phone_number: string;
  course_id: string;
  course_title: string;
  lesson_id: string;
  lesson_title: string;
  first_viewed_at: string;
  last_viewed_at: string;
  view_count: number;
  watch_duration_seconds?: number;
  source: "course_details_page" | "dashboard" | "search" | "dashboard_preview";
  status: "viewed" | "contacted" | "converted";
  purchase_status: "not_purchased" | "purchased";
  purchased_at?: string | null;
  assigned_to?: string | null;
}

const LOCAL_LEADS_KEY = "skillspring_preview_leads_store";

function getLocalLeads(): LeadItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_LEADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLeads(leads: LeadItem[]) {
  try {
    localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(leads));
  } catch {}
}

export const leadService = {
  /**
   * Captures a Free Preview Lead event in the background upon confirmed video play.
   * Ensures idempotency: updates view_count and last_viewed_at for existing user+course+lesson pairs.
   */
  trackFreePreview: async (payload: {
    courseId: string;
    courseTitle?: string;
    lessonId: string;
    lessonTitle?: string;
    source?: "course_details_page" | "dashboard" | "search" | "dashboard_preview";
    watchDurationSeconds?: number;
  }): Promise<void> => {
    try {
      // 1. Fire non-blocking API call to backend
      await apiClient("/leads/free-preview", {
        method: "POST",
        body: JSON.stringify({
          course_id: payload.courseId,
          lesson_id: payload.lessonId,
          source: payload.source || "dashboard_preview",
          watch_duration_seconds: payload.watchDurationSeconds,
        }),
      });
    } catch {
      // Fallback: Store lead event locally for instant UI sync and offline reliability
      try {
        const local = getLocalLeads();
        const now = new Date().toISOString();
        const existingIdx = local.findIndex(
          (l) => l.course_id === payload.courseId && l.lesson_id === payload.lessonId
        );

        if (existingIdx >= 0) {
          local[existingIdx].last_viewed_at = now;
          local[existingIdx].view_count += 1;
          if (payload.watchDurationSeconds) {
            local[existingIdx].watch_duration_seconds = Math.max(
              local[existingIdx].watch_duration_seconds || 0,
              payload.watchDurationSeconds
            );
          }
        } else {
          local.unshift({
            id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            user_id: "current-user",
            user_name: "Student Learner",
            user_email: "learner@architecturenext.in",
            phone_number: "+91 98765 43210",
            course_id: payload.courseId,
            course_title: payload.courseTitle || "Architecture Course",
            lesson_id: payload.lessonId,
            lesson_title: payload.lessonTitle || "Preview Lesson",
            first_viewed_at: now,
            last_viewed_at: now,
            view_count: 1,
            watch_duration_seconds: payload.watchDurationSeconds || 0,
            source: payload.source || "dashboard_preview",
            status: "viewed",
            purchase_status: "not_purchased",
          });
        }
        saveLocalLeads(local);
      } catch {}
    }
  },

  /**
   * Retrieves all captured preview leads for the Admin CRM table.
   */
  getAdminLeads: async (): Promise<LeadItem[]> => {
    try {
      const res = await apiClient<LeadItem[]>("/admin/leads");
      if (Array.isArray(res) && res.length > 0) return res;
      return getLocalLeads();
    } catch {
      return getLocalLeads();
    }
  },

  /**
   * Updates lead status (e.g. marked as 'contacted' or 'converted').
   */
  updateLeadStatus: async (leadId: string, status: "viewed" | "contacted" | "converted"): Promise<void> => {
    try {
      await apiClient(`/admin/leads/${leadId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch {
      const local = getLocalLeads();
      const item = local.find((l) => l.id === leadId);
      if (item) {
        item.status = status;
        saveLocalLeads(local);
      }
    }
  },

  /**
   * Exports the filtered leads table as a downloadable CSV file.
   */
  exportCsv: (leads: LeadItem[], filename = "architecturenext-preview-leads.csv") => {
    const headers = [
      "User Name",
      "Email",
      "Phone",
      "Course Title",
      "Lesson Previewed",
      "First Viewed",
      "Last Viewed",
      "View Count",
      "Watch Duration (Sec)",
      "Source",
      "Lead Status",
      "Purchase Status",
    ];

    const rows = leads.map((l) => [
      `"${(l.user_name || "N/A").replace(/"/g, '""')}"`,
      `"${(l.user_email || "").replace(/"/g, '""')}"`,
      `"${(l.phone_number || "Not provided").replace(/"/g, '""')}"`,
      `"${(l.course_title || "").replace(/"/g, '""')}"`,
      `"${(l.lesson_title || "").replace(/"/g, '""')}"`,
      `"${new Date(l.first_viewed_at).toLocaleString()}"`,
      `"${new Date(l.last_viewed_at).toLocaleString()}"`,
      l.view_count || 1,
      l.watch_duration_seconds || 0,
      `"${l.source || "dashboard_preview"}"`,
      `"${l.status || "viewed"}"`,
      `"${l.purchase_status || "not_purchased"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
