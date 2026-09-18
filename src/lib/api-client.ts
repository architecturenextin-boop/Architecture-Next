const API_BASE = 
  import.meta.env.VITE_API_URL || 
  (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" 
    ? "https://api.architecturenext.in/api/v1" 
    : "https://api.architecturenext.in/api/v1");

const TOKEN_KEY = "skillspring_auth_token";

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  errors?: any;
}

export class ApiError extends Error {
  statusCode: number;
  data?: any;
  code?: string;

  constructor(message: string, statusCode = 500, data?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
    this.code = data?.code;
  }
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.get();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const isJson = res.headers.get("content-type")?.includes("application/json");
    const json = isJson ? await res.json() : null;

    if (!res.ok) {
      const errorMessage = json?.message || `HTTP Error ${res.status}: ${res.statusText}`;
      throw new ApiError(errorMessage, res.status, json);
    }

    // Unpack standardized { success: true, data: ... }
    if (json && typeof json === "object" && "data" in json) {
      return json.data as T;
    }

    return json as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err?.message || "Network request failed", 500);
  }
}

export function getApiConfig(endpoint: string): { url: string; headers: Record<string, string> } {
  const token = tokenStorage.get();
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${normalizedEndpoint}`;
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return { url, headers };
}
