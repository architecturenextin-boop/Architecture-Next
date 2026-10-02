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

// In-memory module cache & in-flight promise to prevent duplicate requests
let memoryProfile: Profile | null = null;
let memoryLoaded = false;
let activeFetchPromise: Promise<Profile | null> | null = null;

const CACHED_PROFILE_KEY = "skillspring_cached_profile";

function getCachedProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHED_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function setCachedProfile(p: Profile | null) {
  if (typeof window === "undefined") return;
  try {
    if (p) {
      localStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(p));
    } else {
      localStorage.removeItem(CACHED_PROFILE_KEY);
    }
  } catch (_) {}
}

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(() => memoryProfile || getCachedProfile());
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (memoryLoaded) return false;
    const token = typeof window !== "undefined" ? tokenStorage.get() : null;
    return Boolean(token) && !memoryProfile && !getCachedProfile();
  });

  const fetchUser = useCallback(async () => {
    const token = tokenStorage.get();
    if (!token) {
      memoryProfile = null;
      memoryLoaded = true;
      setCachedProfile(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    if (activeFetchPromise) {
      const userProfile = await activeFetchPromise;
      setProfile(userProfile || getCachedProfile());
      setIsLoading(false);
      return;
    }

    activeFetchPromise = (async () => {
      try {
        const data = await authService.getMe();
        const userProfile = data.profile || data.user || null;
        memoryProfile = userProfile;
        memoryLoaded = true;
        if (userProfile) {
          setCachedProfile(userProfile);
        }
        return userProfile;
      } catch (err: any) {
        const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
        const isNetworkErr = err?.name === "TypeError" || !err?.statusCode || err?.statusCode === 503;

        // If user is offline or server unreachable, PRESERVE login and fallback to cached profile
        if (isOffline || isNetworkErr) {
          const cached = getCachedProfile();
          memoryProfile = cached;
          memoryLoaded = true;
          return cached;
        }

        // Only clear if explicitly unauthorized (401 / 403)
        if (err?.statusCode === 401 || err?.statusCode === 403) {
          tokenStorage.clear();
          setCachedProfile(null);
          memoryProfile = null;
        }

        memoryLoaded = true;
        return null;
      } finally {
        activeFetchPromise = null;
      }
    })();

    const result = await activeFetchPromise;
    setProfile(result || getCachedProfile());
    setIsLoading(false);
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

