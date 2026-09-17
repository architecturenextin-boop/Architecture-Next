import { apiClient, tokenStorage } from "../api-client";
import type { Profile } from "../database.types";

export interface AuthResponse {
  user?: Profile;
  token?: string;
  message?: string;
  email?: string;
  requiresVerification?: boolean;
}

export interface VerifyOtpResponse {
  user: Profile;
  token: string;
  message: string;
}

export interface VerifyResetOtpResponse {
  message: string;
  resetToken: string;
}

export const authService = {
  register: async (payload: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    username?: string;
    phone?: string;
  }): Promise<AuthResponse> => {
    return apiClient<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  verifyOtp: async (payload: { email: string; otp: string }): Promise<VerifyOtpResponse> => {
    const data = await apiClient<VerifyOtpResponse>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data?.token) {
      tokenStorage.set(data.token);
    }
    return data;
  },

  resendOtp: async (payload: {
    email: string;
    purpose?: "SIGNUP_VERIFY" | "PASSWORD_RESET";
  }): Promise<{ message: string }> => {
    return apiClient<{ message: string }>("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login: async (payload: { email: string; password: string }): Promise<AuthResponse> => {
    const data = await apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data?.token) {
      tokenStorage.set(data.token);
    }
    return data;
  },

  getMe: async (): Promise<{ user: Profile; profile: Profile }> => {
    return apiClient<{ user: Profile; profile: Profile }>("/auth/me");
  },

  updateProfile: async (payload: Partial<Profile>): Promise<{ user: Profile; profile: Profile }> => {
    return apiClient<{ user: Profile; profile: Profile }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } catch {}
    tokenStorage.clear();
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return apiClient("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  verifyResetOtp: async (payload: { email: string; otp: string }): Promise<VerifyResetOtpResponse> => {
    return apiClient<VerifyResetOtpResponse>("/auth/verify-reset-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  resetPassword: async (payload: { resetToken: string; newPassword: string }): Promise<{ message: string }> => {
    return apiClient("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    return apiClient("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};
