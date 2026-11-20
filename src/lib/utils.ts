import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Checks if a duration string is a valid time duration (e.g. "12:30", "45 mins", "1h 20m")
 * and filters out placeholder strings like "PDF Document", "Document", "00:00", etc.
 */
export function isValidDuration(dur?: string | null): boolean {
  if (!dur) return false;
  const s = dur.trim().toLowerCase();
  if (
    !s ||
    s === "00:00" ||
    s === "0:00" ||
    s === "0" ||
    s === "--:--" ||
    s.includes("pdf") ||
    s.includes("document") ||
    s.includes("doc") ||
    s.includes("file") ||
    s.includes("download") ||
    s.includes("resource") ||
    s.includes("attachment")
  ) {
    return false;
  }
  // Must contain at least one digit to be a valid time duration
  if (!/\d/.test(s)) {
    return false;
  }
  return true;
}

/**
 * Reads a course's own enrollment total from whichever field the courses API
 * provides. Returns 0 when the API sends no per-course count, so the UI can hide
 * the metric instead of showing an invented number.
 */
export function getCourseEnrollmentCount(course: {
  enrollment_count?: number | null;
  enrolled_count?: number | null;
  students_count?: number | null;
} | null | undefined): number {
  if (!course) return 0;
  const raw = course.enrollment_count ?? course.enrolled_count ?? course.students_count ?? 0;
  const count = Number(raw);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

/** Compact learner counts: 950, 1.2k, 18k. */
export function formatLearnerCount(count: number): string {
  if (count < 1000) return String(count);
  if (count < 10000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${Math.round(count / 1000)}k`;
}

/**
 * Resolves media paths and URLs (covers, lesson videos, avatars, documents)
 * to work seamlessly across development and production environments.
 */
export function getMediaUrl(urlOrPath?: string | null): string {
  if (!urlOrPath) return "";

  const trimmed = urlOrPath.trim();
  if (!trimmed) return "";

  const envApiUrl = import.meta.env.VITE_API_URL || "";
  const envBackendUrl = import.meta.env.VITE_BACKEND_URL || "";

  let serverBase = "";
  if (envBackendUrl) {
    serverBase = envBackendUrl.replace(/\/$/, "");
  } else if (envApiUrl) {
    serverBase = envApiUrl.replace(/\/api\/v1\/?$/, "");
  } else if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      serverBase = "http://localhost:5000";
    } else {
      serverBase = "https://api.architecturenext.in";
    }
  } else {
    serverBase = "https://api.architecturenext.in";
  }

  const apiBase = envApiUrl || `${serverBase}/api/v1`;

  const envMediaUrl = import.meta.env.VITE_MEDIA_URL || "";
  const isProd = typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
  const r2Base = envMediaUrl ? envMediaUrl.replace(/\/$/, "") : (isProd ? "https://media.architecturenext.in" : "");

  // External or absolute URLs (YouTube, Cloudflare R2, Vimeo, Cloudinary, S3, etc.)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (
      trimmed.includes("localhost:5000") &&
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      return trimmed.replace(/^http:\/\/localhost:5000/, serverBase || window.location.origin);
    }

    // Normalize any Cloudflare R2 dev bucket URL to the configured CDN/custom domain
    const r2DevMatch = trimmed.match(/^https?:\/\/[^/]*\.r2\.dev(\/.*)?$/);
    if (r2DevMatch && r2Base) {
      const pathPart = r2DevMatch[1] || "";
      return `${r2Base}${pathPart}`;
    }

    return trimmed;
  }

  // Helper to append auth token for media streaming & downloads
  const withAuthToken = (url: string): string => {
    if (typeof window === "undefined" || url.includes("token=")) return url;
    try {
      const token =
        localStorage.getItem("skillspring_auth_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("auth_token");
      if (token) {
        return `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
      }
    } catch (_) {}
    return url;
  };

  // Direct R2 CDN routing for video, document, and subtitle streaming
  if (r2Base) {
    if (trimmed.includes("/api/v1/media/video/")) {
      const filename = trimmed.split("?")[0].split("/").pop() || "";
      if (filename.startsWith("subt-") || filename.endsWith(".vtt") || filename.endsWith(".srt")) {
        return `${r2Base}/subtitles/${filename}`;
      }
      return `${r2Base}/videos/${filename}`;
    }
    if (trimmed.includes("/api/v1/media/document/")) {
      const filename = trimmed.split("?")[0].split("/").pop() || "";
      return `${r2Base}/documents/${filename}`;
    }
    if (trimmed.includes("/api/v1/media/subtitles/")) {
      const filename = trimmed.split("?")[0].split("/").pop() || "";
      return `${r2Base}/subtitles/${filename}`;
    }
  }

  // Authenticated media stream route fallback
  if (trimmed.includes("/api/v1/media/")) {
    const mediaPath = trimmed.slice(trimmed.indexOf("/api/v1/media/"));
    return withAuthToken(`${serverBase}${mediaPath}`);
  }

  // Private lesson subtitles -> route directly to Cloudflare R2 CDN if configured, else backend media endpoint
  if (
    trimmed.startsWith("/uploads/subtitles/") ||
    trimmed.startsWith("subtitles/") ||
    trimmed.startsWith("subt-") ||
    trimmed.endsWith(".vtt") ||
    trimmed.endsWith(".srt")
  ) {
    const filename = trimmed.split("?")[0].split("/").pop() || "";
    if (r2Base) {
      return `${r2Base}/subtitles/${filename}`;
    }
    return withAuthToken(`${apiBase}/media/video/${filename}`);
  }

  // Private lesson videos -> route directly to Cloudflare R2 CDN if configured, else backend media endpoint
  if (
    trimmed.startsWith("/uploads/videos/") ||
    trimmed.startsWith("videos/") ||
    trimmed.startsWith("lesson-video-") ||
    trimmed.endsWith(".mp4") ||
    trimmed.endsWith(".webm") ||
    trimmed.endsWith(".mov") ||
    trimmed.endsWith(".mkv")
  ) {
    const filename = trimmed.split("?")[0].split("/").pop() || "";
    if (r2Base) {
      return `${r2Base}/videos/${filename}`;
    }
    return withAuthToken(`${apiBase}/media/video/${filename}`);
  }

  // Private lesson documents -> route directly to Cloudflare R2 CDN if configured, else backend media endpoint
  if (
    trimmed.startsWith("/uploads/documents/") ||
    trimmed.startsWith("documents/") ||
    trimmed.startsWith("doc-") ||
    trimmed.endsWith(".pdf") ||
    trimmed.endsWith(".psd") ||
    trimmed.endsWith(".dwg") ||
    trimmed.endsWith(".mp3") ||
    trimmed.endsWith(".zip") ||
    trimmed.endsWith(".rar")
  ) {
    const filename = trimmed.split("?")[0].split("/").pop() || "";
    if (r2Base) {
      return `${r2Base}/documents/${filename}`;
    }
    return withAuthToken(`${apiBase}/media/document/${filename}`);
  }

  // Public uploads directory (images, covers, avatars)
  if (trimmed.startsWith("/uploads/")) {
    return `${serverBase}${trimmed}`;
  }

  // Static root assets in frontend public folder (e.g. /course-cover.jpeg, /hero-learner.jpeg)
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `${serverBase}/${trimmed}`;
}


