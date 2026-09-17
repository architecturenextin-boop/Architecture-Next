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

  const apiBase = 
    import.meta.env.VITE_API_URL || 
    (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" 
      ? "/api/v1" 
      : "http://localhost:5000/api/v1");
  const serverBase = apiBase.replace(/\/api\/v1\/?$/, "");

  // If it's an external URL (YouTube, Vimeo, Cloudinary, etc.)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.includes("localhost:5000") && typeof window !== "undefined" && window.location.hostname !== "localhost") {
      return trimmed.replace(/^http:\/\/localhost:5000/, serverBase);
    }
    return trimmed;
  }

  // If already an authenticated media stream route
  if (trimmed.startsWith("/api/v1/media/")) {
    return `${serverBase}${trimmed}`;
  }

  // Video path -> route to authenticated media endpoint
  if (trimmed.includes("videos/")) {
    const filename = trimmed.split("/").pop();
    return `${apiBase}/media/video/${filename}`;
  }

  // Document path -> route to authenticated media endpoint
  if (trimmed.includes("documents/")) {
    const filename = trimmed.split("/").pop();
    return `${apiBase}/media/document/${filename}`;
  }

  // Public images
  if (trimmed.startsWith("/uploads/")) {
    return `${serverBase}${trimmed}`;
  }

  return `${serverBase}/${trimmed.replace(/^\//, "")}`;
}
