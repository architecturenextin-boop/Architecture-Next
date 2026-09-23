import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
    return trimmed;
  }

  // Authenticated media stream route
  if (trimmed.includes("/api/v1/media/")) {
    const mediaPath = trimmed.slice(trimmed.indexOf("/api/v1/media/"));
    return `${serverBase}${mediaPath}`;
  }

  // Private lesson videos -> route to authenticated media endpoint
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
    return `${apiBase}/media/video/${filename}`;
  }

  // Private lesson documents -> route to authenticated media endpoint
  if (
    trimmed.startsWith("/uploads/documents/") ||
    trimmed.startsWith("documents/") ||
    trimmed.startsWith("doc-") ||
    trimmed.endsWith(".pdf")
  ) {
    const filename = trimmed.split("?")[0].split("/").pop() || "";
    return `${apiBase}/media/document/${filename}`;
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


