import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, dispatchAuthChange } from "@/hooks/use-auth";
import { authService } from "@/lib/services/auth.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/profile")({
  head: () => ({ meta: [{ title: "Profile — ArchitectureNext" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // 1. Query the profile row with React Query
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-details", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const res = await authService.getMe();
      return res.profile || res.user;
    },
    enabled: !!user?.id,
  });

  // Sync profile details to local states
  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  // 2. Mutation to update profile row
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedName: string) => {
      if (!user) return;
      await authService.updateProfile({
        full_name: updatedName,
        phone: phone || undefined,
      });
    },
    onSuccess: async () => {
      dispatchAuthChange();
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["profile-details", user?.id] });
      toast.success("Profile updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile.");
    }
  });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(name);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  if (isLoading || !profile) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your account details.</p>
      <form onSubmit={save} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-xl font-bold text-primary-foreground">
            {(name || "L")[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">{name || "Learner"}</div>
            {phone && <div className="text-xs text-muted-foreground">+91 {phone}</div>}
          </div>
        </div>
        <label className="block">
          <span className="text-sm font-medium">Full name</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" required />
        </label>
        {phone && (
          <label className="block">
            <span className="text-sm font-medium">Mobile</span>
            <Input value={`+91 ${phone}`} disabled className="mt-1.5" />
          </label>
        )}
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <Input value={profile.email || ""} disabled className="mt-1.5" />
        </label>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="min-h-[44px] bg-gradient-primary text-primary-foreground font-semibold"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
          <Button type="button" variant="outline" onClick={handleSignOut} className="min-h-[44px]">
            Sign out
          </Button>
        </div>
      </form>
    </div>
  );
}
