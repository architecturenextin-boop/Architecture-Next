import { createFileRoute, useNavigate, redirect, isRedirect } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, GraduationCap } from "lucide-react";
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
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<string>("Switch careers");
  const [isLoading, setIsLoading] = useState(false);
  const goals = ["Switch careers", "Get promoted", "Start a side project", "Learn for fun"];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    try {
      await authService.updateProfile({
        full_name: name.trim() || "Learner",
        goal: goal,
        onboarded: true,
      });

      dispatchAuthChange();
      await refreshProfile();
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-hero p-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card p-7 shadow-elevated">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-accent text-accent-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold">Let's personalize your learning</h1>
          <p className="mt-1 text-sm text-muted-foreground">Two quick questions, then you're in.</p>
          <form onSubmit={submit} className="mt-6 space-y-5">
            <label className="block">
              <span className="text-sm font-medium">What should we call you?</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1.5"
                required
              />
            </label>
            <div>
              <span className="text-sm font-medium">What's your main goal?</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {goals.map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGoal(g)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      goal === g
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input bg-surface text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full bg-gradient-primary text-primary-foreground hover:opacity-95"
            >
              {isLoading ? "Saving..." : "Continue"} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
