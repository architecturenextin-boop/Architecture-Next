import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { authService } from "@/lib/services/auth.service";
import { tokenStorage } from "@/lib/api-client";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const token = tokenStorage.get();
    if (!token) throw redirect({ to: "/auth" });

    try {
      const { user } = await authService.getMe();
      if (!user?.onboarded) throw redirect({ to: "/onboarding" });
    } catch {
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <AppShell><Outlet /></AppShell>,
});

