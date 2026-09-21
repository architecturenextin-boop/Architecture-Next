import { useEffect, useState, useCallback } from "react";
import { authService } from "@/lib/services/auth.service";
import { tokenStorage } from "@/lib/api-client";
import type { Profile } from "@/lib/database.types";

// Broadcast channel / custom event for cross-tab or component auth sync
const AUTH_STATE_CHANGE_EVENT = "skillspring_auth_state_change";

export function dispatchAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
  }
}

// In-memory module cache to prevent flickering/buffering on route navigation
let memoryProfile: Profile | null = null;
let memoryLoaded = false;

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(memoryProfile);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (memoryLoaded) return false;
    const token = typeof window !== "undefined" ? tokenStorage.get() : null;
    return Boolean(token);
  });

  const fetchUser = useCallback(async () => {
    const token = tokenStorage.get();
    if (!token) {
      memoryProfile = null;
      memoryLoaded = true;
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await authService.getMe();
      const userProfile = data.profile || data.user || null;
      memoryProfile = userProfile;
      memoryLoaded = true;
      setProfile(userProfile);
    } catch (err) {
      tokenStorage.clear();
      memoryProfile = null;
      memoryLoaded = true;
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const handleAuthEvent = () => {
      fetchUser();
    };

    window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthEvent);
    window.addEventListener("storage", handleAuthEvent);

    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthEvent);
      window.removeEventListener("storage", handleAuthEvent);
    };
  }, [fetchUser]);

  const signOut = async () => {
    await authService.logout();
    memoryProfile = null;
    memoryLoaded = true;
    setProfile(null);
    dispatchAuthChange();
  };

  const refreshProfile = async () => {
    await fetchUser();
  };

  // Mock user and session object for backwards-compatibility with existing component props
  const user = profile
    ? ({
        id: profile.id,
        email: profile.email || "",
        app_metadata: {},
        user_metadata: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          full_name: profile.full_name,
          phone: profile.phone,
        },
        aud: "authenticated",
        created_at: profile.created_at,
      } as any)
    : null;

  const session = profile && tokenStorage.get()
    ? ({
        access_token: tokenStorage.get() || "",
        user: user as any,
      } as any)
    : null;

  return {
    user,
    profile,
    session,
    isLoading,
    signOut,
    refreshProfile,
  };
}

export type UseAuthReturn = ReturnType<typeof useAuth>;

