import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock, AtSign, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brand } from "@/lib/brand";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { AuthTestimonial } from "@/components/auth-testimonial";
import { authService } from "@/lib/services/auth.service";
import { dispatchAuthChange } from "@/hooks/use-auth";
import { tokenStorage } from "@/lib/api-client";
import heroImg from "@/assets/hero-learner.jpeg";

interface AuthSearch {
  redirect?: string;
}

function getSafeRedirect(redirect?: string): string | null {
  if (!redirect) return null;
  // Must be a relative URL starting with / and not // (to prevent open redirect vulnerabilities)
  if (redirect.startsWith("/") && !redirect.startsWith("//") && !redirect.includes("javascript:")) {
    return redirect;
  }
  return null;
}

export const Route = createLazyFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const safeRedirect = getSafeRedirect(search.redirect);

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

  const handlePostAuthRedirect = (user: any) => {
    if (user?.role === "admin") {
      navigate({ to: "/admin" });
    } else if (!user?.onboarded) {
      navigate({
        to: "/onboarding",
        search: safeRedirect ? { redirect: safeRedirect } : undefined,
      });
    } else if (safeRedirect) {
      window.location.href = safeRedirect;
    } else {
      navigate({ to: "/" });
    }
  };

  useEffect(() => {
    let active = true;
    if (tokenStorage.get()) {
      authService
        .getMe()
        .then(({ user }) => {
          if (!active) return;
          handlePostAuthRedirect(user);
        })
        .catch(() => {
          tokenStorage.clear();
        });
    }
    return () => {
      active = false;
    };
  }, [navigate, safeRedirect]);

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
      handlePostAuthRedirect(user);
    } catch (error: any) {
      if (error?.code === "UNVERIFIED_EMAIL" || error?.data?.code === "UNVERIFIED_EMAIL" || error?.message?.includes("not verified")) {
        navigate({
          to: "/verify-otp",
          search: {
            email: email.trim(),
            purpose: "signup",
            redirect: safeRedirect || undefined,
          },
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
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-[40%_60%] bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Mobile Top Image Banner — tighter crop on the learner, safe-area aware */}
      <div className="relative w-full h-56 sm:h-64 lg:hidden overflow-hidden bg-muted shrink-0 pt-[env(safe-area-inset-top)]">
        <img
          src={heroImg}
          alt="Architecture student"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "center 8%" }}
        />
        {/* Top scrim keeps the back button and logo legible over the photo */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/70 via-black/25 to-transparent pointer-events-none" />
        {/* Bottom fade runs into the sheet below so the banner and card read as one surface */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B12]/95 via-[#0B0B12]/25 to-transparent pointer-events-none" />

        {/* Mobile Header elements inside top banner */}
        <div className="relative z-10 flex h-full flex-col justify-between p-4 pb-10 pt-5">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-xs font-semibold text-white hover:bg-black/70 transition-all shadow-md"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
            <Link to="/">
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-7 w-auto object-contain brightness-0 invert drop-shadow-md"
              />
            </Link>
          </div>

          <div className="text-white drop-shadow-md pb-0">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-white/90 bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full mb-1 border border-white/20">
              ArchitectureNext
            </span>
            <p className="text-sm font-semibold leading-tight text-white/95 drop-shadow-sm">
              Master design workflows, presentation &amp; verified certification
            </p>
          </div>
        </div>
      </div>

      {/* Left Panel: Full-Bleed Split Image + Logo + Quote (Desktop: 40% width) */}
      <div className="relative hidden h-full flex-col bg-muted p-10 lg:p-12 text-white dark:border-r lg:flex justify-between overflow-hidden">
        {/* Full-bleed background hero photo anchored to top */}
        <img
          src={heroImg}
          alt="Architecture student"
          className="absolute inset-0 h-full w-full object-cover object-top"
          style={{ objectPosition: "center top" }}
        />

        {/* Ambient Dark & Brand Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B12]/95 via-[#0B0B12]/80 to-[#1F3375]/75" />
        <div className="pointer-events-none absolute -top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-[#294398]/30 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-[#643A91]/40 blur-[120px]" />

        {/* Top Logo */}
        <div className="relative z-20 flex items-center">
          <Link to="/" className="inline-block">
            <img
              src={brand.logoUrl}
              alt={brand.name}
              className="h-8 w-auto object-contain brightness-0 invert drop-shadow-md"
            />
          </Link>
        </div>

        {/* Bottom Testimonial / Quote (following 21st.dev login pattern) */}
        <div className="relative z-20 mt-auto pt-12">
          <AuthTestimonial />
        </div>
      </div>

      {/* Right Panel: Clean, Spacious Authentication Form */}
      <div className="relative z-20 -mt-6 lg:mt-0 rounded-t-[28px] lg:rounded-none bg-background border-t border-border/40 lg:border-t-0 flex flex-col justify-between p-6 sm:p-10 lg:p-12 min-h-screen lg:min-h-full overflow-y-auto">
        <div className="mx-auto flex w-full flex-col justify-center my-auto max-w-[420px] sm:max-w-[440px]">
          {/* Top navigation row: < Home on left (Desktop only, mobile has it in banner) */}
          <div className="mb-6 hidden lg:flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
              <span>Home</span>
            </Link>
          </div>

          {!isForgotPassword ? (
            /* STANDARD LOGIN FORM */
            <>
              <div className="mb-6">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Sign In or Join Now!
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                  Login or create your ArchitectureNext account.
                </p>
              </div>

              {/* Preferred route in: Google first, email as the fallback */}
              <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-3 sm:p-3.5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Recommended
                  </p>
                  <span className="text-[10px] font-semibold text-primary">Fastest sign in</span>
                </div>
                <div className="w-full max-w-full min-w-0">
                  <GoogleAuthButton
                    redirect={safeRedirect || undefined}
                    text="continue_with"
                    shape="rectangular"
                    size="large"
                    hideTrustBadge={true}
                  />
                </div>
              </div>

              {/* Clean OR Divider */}
              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/80" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-3 font-semibold text-muted-foreground tracking-wider">
                    OR
                  </span>
                </div>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={submit} className="space-y-4">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Enter your email address to sign in or create an account
                </p>

                {/* Email Address with @ icon */}
                <div>
                  <div className="relative flex items-center">
                    <AtSign className="absolute left-3.5 h-4.5 w-4.5 text-muted-foreground pointer-events-none" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErr("");
                      }}
                      placeholder="your.email@example.com"
                      className="h-12 rounded-xl bg-background border-border/80 pl-10 pr-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                      required
                    />
                  </div>
                </div>

                {/* Password with Lock icon & Eye toggle */}
                <div>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4.5 w-4.5 text-muted-foreground pointer-events-none" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErr("");
                      }}
                      placeholder="Password"
                      className="h-12 rounded-xl bg-background border-border/80 pl-10 pr-11 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-muted-foreground hover:text-foreground transition-colors p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email.trim().toLowerCase());
                      setIsForgotPassword(true);
                      setErr("");
                    }}
                    className="text-xs font-semibold text-[#294398] dark:text-primary hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                {err && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                    {err}
                  </div>
                )}

                {/* Continue With Email Primary Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-[#294398] to-[#643A91] hover:brightness-110 font-bold text-white shadow-sm transition-all rounded-xl text-base cursor-pointer mt-1"
                >
                  {isLoading ? "Signing in..." : "Continue With Email"}
                </Button>
              </form>

              {/* Terms Agreement notice */}
              <p className="mt-5 text-center text-xs text-muted-foreground leading-normal">
                By clicking continue, you agree to our{" "}
                <a href="#" onClick={(e) => e.preventDefault()} className="underline underline-offset-4 hover:text-primary">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" onClick={(e) => e.preventDefault()} className="underline underline-offset-4 hover:text-primary">
                  Privacy Policy
                </a>.
              </p>

              {/* Don't have an account link */}
              <div className="pt-4 text-center text-xs sm:text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  search={safeRedirect ? { redirect: safeRedirect } : undefined}
                  className="font-bold text-[#294398] dark:text-primary hover:underline"
                >
                  Sign Up
                </Link>
              </div>
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
                  className="inline-flex min-h-[36px] items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-primary bg-muted/40 hover:bg-primary/10 border border-border/60 hover:border-primary/25 transition-all duration-200 mb-4 group cursor-pointer"
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
                <div className="rounded-md border border-primary/20 bg-primary/10 p-3 text-xs font-semibold text-primary flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{forgotMsg}</span>
                </div>
              )}

              {err && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                  {err}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Email Address
                  </label>
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
                    className="h-11 rounded-md bg-white dark:bg-card border-border/80 px-3.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={forgotLoading}
                  className="w-full h-12 bg-gradient-to-r from-[#294398] to-[#643A91] hover:brightness-110 font-bold text-white shadow-sm transition-all rounded-xl cursor-pointer text-base"
                >
                  {forgotLoading ? "Sending Code..." : "Send Verification Code"}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Bottom copyright footer */}
        <div className="pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ArchitectureNext. All rights reserved.
        </div>
      </div>
    </div>
  );
}
