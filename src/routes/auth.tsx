import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowLeft, Mail, Lock, Sparkles, CheckCircle2, ShieldCheck, Eye, EyeOff, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand-logo";
import { authService } from "@/lib/services/auth.service";
import { dispatchAuthChange } from "@/hooks/use-auth";
import { tokenStorage } from "@/lib/api-client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — ArchitectureNext" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    if (tokenStorage.get()) {
      authService
        .getMe()
        .then(({ user }) => {
          if (!active) return;
          if (user?.role === "admin") {
            navigate({ to: "/admin" });
          } else if (user?.onboarded) {
            navigate({ to: "/" });
          } else {
            navigate({ to: "/onboarding" });
          }
        })
        .catch(() => {
          tokenStorage.clear();
        });
    }
    return () => {
      active = false;
    };
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErr("Please enter both email and password");
      return;
    }
    setIsLoading(true);
    setErr("");
    try {
      const { user } = await authService.login({
        email: email.trim(),
        password: password,
      });

      dispatchAuthChange();

      if (user?.role === "admin") {
        navigate({ to: "/admin" });
      } else if (user?.onboarded) {
        navigate({ to: "/" });
      } else {
        navigate({ to: "/onboarding" });
      }
    } catch (error: any) {
      if (error?.code === "UNVERIFIED_EMAIL" || error?.data?.code === "UNVERIFIED_EMAIL" || error?.message?.includes("not verified")) {
        navigate({
          to: "/verify-otp",
          search: { email: email.trim(), purpose: "signup" },
        });
        return;
      }
      setErr(error?.message || "Invalid email or password.");
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErr("Please enter a valid email address.");
      return;
    }

    setForgotLoading(true);
    setErr("");
    setForgotMsg("");

    try {
      await authService.forgotPassword(cleanEmail);
      setForgotMsg("Verification code sent! Redirecting...");
      setTimeout(() => {
        navigate({
          to: "/verify-otp",
          search: { email: cleanEmail, purpose: "reset" },
        });
      }, 600);
    } catch (error: any) {
      setErr(error?.message || "Failed to process forgot password request.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2 bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Left Branding Showcase (Desktop) */}
      <div className="hidden bg-gradient-hero p-12 md:flex md:flex-col md:justify-between border-r border-border/60 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand-blue/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-brand-purple/20 blur-[120px]" />

        <BrandLogo size="lg" />

        <div className="relative space-y-6 max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
            Welcome Back
          </span>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-foreground tracking-tight">
            Pick up where you left off.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Sign in to access your enrolled courses, BIM project files, verified certificates, and live mentor sessions.
          </p>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-3 text-sm font-medium text-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <span>Resume video lessons &amp; downloadable resources</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <span>Track course progress &amp; module certificates</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <span>Secure password-protected student accounts</span>
            </div>
          </div>
        </div>

        <div className="relative text-xs font-medium text-muted-foreground">
          © {new Date().getFullYear()} ArchitectureNext. All rights reserved.
        </div>
      </div>

      {/* Right Sign-in Form */}
      <div className="flex flex-col items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center justify-between w-full">
            <div className="md:hidden">
              <BrandLogo size="sm" />
            </div>
            <Link
              to="/"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary transition-colors ml-auto group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Home
            </Link>
          </div>

          {!isForgotPassword ? (
            /* STANDARD LOGIN FORM */
            <>
              <div>
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                  Sign in to your account
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter your registered email and password to log in.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-5">
                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2.5 rounded-xl border border-input bg-surface px-3.5 py-1 focus-within:ring-2 focus-within:ring-ring transition-all">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErr("");
                      }}
                      placeholder="name@example.com"
                      className="border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 text-sm h-10 tracking-wide font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email.trim().toLowerCase());
                        setIsForgotPassword(true);
                        setErr("");
                      }}
                      className="text-xs font-semibold text-primary hover:underline py-1 px-1 touch-manipulation cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-input bg-surface px-3.5 py-1 focus-within:ring-2 focus-within:ring-ring transition-all relative">
                    <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErr("");
                      }}
                      placeholder="••••••••"
                      className="border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 text-sm h-10 tracking-wide font-medium pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {err && (
                    <span className="mt-1.5 block text-xs font-semibold text-destructive">{err}</span>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-primary font-bold text-primary-foreground shadow-soft transition-all hover:shadow-elevated hover:brightness-110 rounded-xl"
                >
                  {isLoading ? "Signing in..." : "Sign In"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            /* FORGOT PASSWORD FORM */
            <>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErr("");
                  }}
                  className="inline-flex min-h-[40px] items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-muted-foreground hover:text-primary bg-muted/40 hover:bg-primary/10 border border-border/60 hover:border-primary/25 transition-all duration-200 mb-4 group cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:-translate-x-1" />
                  <span>Return to Sign In</span>
                </button>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Reset Password
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                  Enter your account email to receive a 6-digit verification code.
                </p>
              </div>

              {forgotMsg && (
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-3.5 text-xs font-semibold text-primary flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{forgotMsg}</span>
                </div>
              )}

              {err && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive">
                  {err}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2.5 rounded-xl border border-input bg-surface px-3.5 py-1 focus-within:ring-2 focus-within:ring-ring transition-all">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        setErr("");
                      }}
                      placeholder="name@example.com"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      inputMode="email"
                      className="border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 text-sm h-10 tracking-wide font-medium"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={forgotLoading}
                  className="w-full h-12 bg-gradient-primary font-bold text-primary-foreground shadow-soft transition-all hover:shadow-elevated hover:brightness-110 rounded-xl"
                >
                  {forgotLoading ? "Sending Code..." : "Send Verification Code"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to ArchitectureNext's{" "}
            <a href="#" className="font-semibold text-foreground hover:underline">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="font-semibold text-foreground hover:underline">Privacy Policy</a>.
          </p>

          {/* Don't have an account link */}
          <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="font-bold text-primary hover:underline">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
