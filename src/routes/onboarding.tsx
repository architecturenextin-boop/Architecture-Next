import { createFileRoute, useNavigate, redirect, isRedirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, GraduationCap, User, AtSign, Phone, Sparkles } from "lucide-react";
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
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [goal, setGoal] = useState<string>("Switch careers");
  const [err, setErr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const goals = ["Switch careers", "Get promoted", "Start a side project", "Learn for fun"];

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
        setPhone(profile.phone);
      }
    }
  }, [profile, name, username, phone]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      setErr("Please enter your name");
      return;
    }

    if (!username.trim()) {
      setErr("Please enter a username");
      return;
    }

    const rawDigits = phone.replace(/\D/g, "");
    const cleanPhone = rawDigits.length > 10 && rawDigits.startsWith("91")
      ? rawDigits.slice(2)
      : rawDigits.slice(-10);

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

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-hero p-4 sm:p-6 selection:bg-primary selection:text-primary-foreground">
      <div className="w-full max-w-lg">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-elevated relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-brand-blue/15 blur-3xl" />
          
          <div className="flex items-center justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-accent text-accent-foreground shadow-sm">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Final Step
            </span>
          </div>

          <h1 className="mt-5 font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Complete your profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Please fill in your details to finalize your account setup.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4 sm:space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Full Name <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-input bg-surface px-3 py-1 focus-within:ring-2 focus-within:ring-ring transition-all">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErr("");
                  }}
                  placeholder="Rahul Kumar"
                  className="border-0 bg-transparent px-0.5 shadow-none focus-visible:ring-0 text-sm h-9 sm:h-10 font-medium"
                  required
                />
              </div>
            </div>

            {/* Username & Mobile Number */}
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Username <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-input bg-surface px-3 py-1 focus-within:ring-2 focus-within:ring-ring transition-all">
                  <AtSign className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                      setErr("");
                    }}
                    placeholder="rahulkumar"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="border-0 bg-transparent px-0.5 shadow-none focus-visible:ring-0 text-sm h-9 sm:h-10 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Mobile Number <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-input bg-surface px-3 py-1 focus-within:ring-2 focus-within:ring-ring transition-all">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-bold text-foreground border-r border-border/80 pr-2 pt-0.5">+91</span>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setErr("");
                    }}
                    placeholder="98765 43210"
                    maxLength={14}
                    className="border-0 bg-transparent px-0.5 shadow-none focus-visible:ring-0 text-sm h-9 sm:h-10 tracking-wide font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Main Goal */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                What's your primary learning goal?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {goals.map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGoal(g)}
                    className={`rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-medium transition text-left cursor-pointer ${
                      goal === g
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-input bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {err && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                {err}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full min-h-[46px] h-11 sm:h-12 bg-gradient-primary font-bold text-primary-foreground shadow-soft transition-all hover:shadow-elevated hover:brightness-110 rounded-xl cursor-pointer mt-2"
            >
              {isLoading ? "Saving..." : "Continue to Dashboard"} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

