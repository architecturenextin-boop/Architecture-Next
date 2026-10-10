import { createFileRoute, useNavigate, redirect, isRedirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, GraduationCap, User, AtSign, Phone, Sparkles, LogOut, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, dispatchAuthChange } from "@/hooks/use-auth";
import { authService } from "@/lib/services/auth.service";
import { tokenStorage } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — ArchitectureNext" }] }),
  beforeLoad: async () => {
    const token = tokenStorage.get();
    if (!token) throw redirect({ to: "/auth" });
    try {
      const { user } = await authService.getMe();
      if (user?.role === "admin") throw redirect({ to: "/admin" });
      if (user?.onboarded) throw redirect({ to: "/dashboard" });
    } catch (err: any) {
      if (isRedirect(err)) throw err;
      tokenStorage.clear();
      throw redirect({ to: "/auth" });
    }
  },
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, signOut, isLoading: isAuthLoading } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [goal, setGoal] = useState<string>("Switch careers");
  const [err, setErr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const goals = ["Switch careers", "Get promoted", "Start a side project", "Learn for fun"];

  // Component-level route guard
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      navigate({ to: "/auth" });
      return;
    }
    if (profile) {
      if (profile.role === "admin") {
        navigate({ to: "/admin" });
        return;
      }
      if (profile.onboarded) {
        navigate({ to: "/dashboard" });
        return;
      }
    }
  }, [profile, navigate]);

  // Pre-fill profile fields if available
  useEffect(() => {
    if (profile) {
      if (!name && profile.full_name) {
        setName(profile.full_name);
      }
      if (!username) {
        if (profile.username) {
          setUsername(profile.username);
        } else if (profile.email) {
          const suggested = profile.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
          setUsername(suggested);
        }
      }
      if (!phone && profile.phone) {
        const clean = profile.phone.replace(/\D/g, "").slice(-10);
        setPhone(clean);
      }
    }
  }, [profile, name, username, phone]);

  const handlePhoneChange = (val: string) => {
    // Only accept numeric digits, up to 10 characters
    const digitsOnly = val.replace(/\D/g, "").slice(0, 10);
    setPhone(digitsOnly);
    setErr("");
  };

  const handleUsernameChange = (val: string) => {
    // Clean lowercase alphanumeric and underscore
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);
    setUsername(clean);
    setErr("");
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.info("Signed out successfully");
      navigate({ to: "/auth" });
    } catch {
      tokenStorage.clear();
      navigate({ to: "/auth" });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = tokenStorage.get();
    if (!token) {
      toast.error("Your session has expired. Please log in again.");
      navigate({ to: "/auth" });
      return;
    }

    if (!name.trim()) {
      setErr("Please enter your full name");
      return;
    }

    if (!username.trim()) {
      setErr("Please choose a username");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErr("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsLoading(true);
    setErr("");

    try {
      await authService.updateProfile({
        full_name: name.trim(),
        username: username.trim().toLowerCase(),
        phone: cleanPhone,
        goal: goal,
        onboarded: true,
      });

      dispatchAuthChange();
      await refreshProfile();
      toast.success("Profile setup complete! Welcome aboard.");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setErr(err?.message || "An error occurred while setting up your profile.");
      toast.error(err?.message || "An error occurred.");
      setIsLoading(false);
    }
  };

  if (isAuthLoading && !profile) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-hero p-4">
        <div className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-border/80 bg-card/90 p-6 sm:p-8 shadow-elevated animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-2xl bg-muted" />
            <div className="h-6 w-24 rounded-full bg-muted" />
          </div>
          <div className="mt-5 h-8 w-3/4 rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
          <div className="mt-6 space-y-4">
            <div className="h-12 rounded-xl bg-muted" />
            <div className="h-12 rounded-xl bg-muted" />
            <div className="h-24 rounded-xl bg-muted" />
            <div className="h-12 rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-gradient-hero px-3.5 py-6 sm:px-6 sm:py-12 selection:bg-primary selection:text-primary-foreground overflow-y-auto">
      <div className="w-full max-w-lg mx-auto my-auto">
        <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card/95 backdrop-blur-md p-5 sm:p-7 md:p-8 shadow-elevated relative overflow-hidden transition-all">
          <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-brand-blue/15 blur-3xl" />

          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="grid h-11 w-11 sm:h-12 sm:w-12 place-items-center rounded-xl sm:rounded-2xl bg-gradient-accent text-accent-foreground shadow-sm">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold text-primary">
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Final Step
            </span>
          </div>

          <h1 className="mt-4 sm:mt-5 font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Complete your profile
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Please fill in your details to finalize your account setup.
          </p>

          <form onSubmit={submit} className="mt-5 sm:mt-6 space-y-4 sm:space-y-4.5">
            {/* Full Name */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Full Name <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-2.5 rounded-xl border border-input bg-surface px-3 py-1 sm:py-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:border-primary/50 transition-all">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErr("");
                  }}
                  placeholder="Rahul Kumar"
                  className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 text-base sm:text-sm h-10 sm:h-10 font-medium"
                  required
                />
              </div>
            </div>

            {/* Username & Mobile Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Username <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-input bg-surface px-3 py-1 sm:py-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:border-primary/50 transition-all">
                  <AtSign className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="rahulkumar"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 text-base sm:text-sm h-10 sm:h-10 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Mobile Number <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-input bg-surface px-3 py-1 sm:py-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:border-primary/50 transition-all">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-foreground border-r border-border/80 pr-2 pt-0.5 select-none shrink-0">
                    +91
                  </span>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 text-base sm:text-sm h-10 sm:h-10 tracking-wider font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Primary Goal */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                What's your primary learning goal?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {goals.map((g) => {
                  const isSelected = goal === g;
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setGoal(g)}
                      className={`group relative flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-medium transition-all text-left cursor-pointer active:scale-[0.98] ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/40 font-semibold"
                          : "border-input bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-surface-elevated"
                      }`}
                    >
                      <span className="truncate pr-1">{g}</span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-primary shrink-0 animate-in zoom-in-50 duration-150" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {err && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive animate-in fade-in-50 duration-150">
                {err}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full min-h-[46px] h-11 sm:h-12 bg-gradient-primary font-bold text-primary-foreground shadow-soft transition-all hover:shadow-elevated hover:brightness-105 active:scale-[0.99] rounded-xl cursor-pointer mt-2 text-sm sm:text-base flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving profile...</span>
                </>
              ) : (
                <>
                  <span>Continue to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Account switcher / Log out escape hatch */}
          <div className="mt-4 pt-3.5 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="truncate max-w-[210px] sm:max-w-[280px]">
              Signed in as <strong className="text-foreground">{profile?.email || user?.email || "Student"}</strong>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 cursor-pointer transition hover:underline"
            >
              <LogOut className="h-3.5 w-3.5" /> Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
