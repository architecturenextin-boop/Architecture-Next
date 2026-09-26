import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, dispatchAuthChange } from "@/hooks/use-auth";
import { authService } from "@/lib/services/auth.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, KeyRound, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/profile")({
  head: () => ({ meta: [{ title: "Profile & Security — ArchitectureNext" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

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

  // 3. Mutation to change password
  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      return authService.changePassword(payload);
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to change password. Please check your current password.");
    }
  });

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(name);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
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
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Profile & Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your personal details and account security.</p>
      </div>

      {/* SECTION 1: ACCOUNT DETAILS */}
      <form onSubmit={saveProfile} className="space-y-4 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft">
        <div className="border-b border-border/60 pb-4">
          <h2 className="font-display text-lg font-bold">Personal Information</h2>
          <p className="text-xs text-muted-foreground">Your contact and account profile details.</p>
        </div>

        <div className="flex items-center gap-4 py-2">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-xl font-bold text-primary-foreground shadow-sm">
            {(name || "L")[0].toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-base">{name || "Learner"}</div>
            <div className="text-xs text-muted-foreground">{profile.email}</div>
            {phone && <div className="text-xs text-muted-foreground mt-0.5">+91 {phone}</div>}
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full name</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" required />
        </label>

        {phone && (
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mobile number</span>
            <Input value={`+91 ${phone}`} disabled className="mt-1.5 bg-muted/40 cursor-not-allowed" />
          </label>
        )}

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email address</span>
          <Input value={profile.email || ""} disabled className="mt-1.5 bg-muted/40 cursor-not-allowed" />
        </label>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/60">
          <Button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="min-h-[44px] bg-gradient-primary text-primary-foreground font-semibold px-6"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
          <Button type="button" variant="outline" onClick={handleSignOut} className="min-h-[44px]">
            Sign out
          </Button>
        </div>
      </form>

      {/* SECTION 2: CHANGE PASSWORD */}
      <form onSubmit={handlePasswordChange} className="space-y-4 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft">
        <div className="border-b border-border/60 pb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" /> Change Password
            </h2>
            <p className="text-xs text-muted-foreground">Update your password to keep your account secure.</p>
          </div>
          <ShieldCheck className="h-6 w-6 text-primary/40 hidden sm:block" />
        </div>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Password</span>
          <div className="relative mt-1.5">
            <Input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Password</span>
            <div className="relative mt-1.5">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm New Password</span>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              className="mt-1.5"
              required
            />
          </label>
        </div>

        <div className="pt-4 border-t border-border/60">
          <Button
            type="submit"
            disabled={changePasswordMutation.isPending || !currentPassword || !newPassword}
            className="min-h-[44px] bg-gradient-primary text-primary-foreground font-semibold px-6 cursor-pointer"
          >
            {changePasswordMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
