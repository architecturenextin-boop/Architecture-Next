import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowRight, ArrowLeft, CheckCircle2, Lock, Mail, RefreshCw, ShieldCheck, Sparkles, Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand-logo";
import { authService } from "@/lib/services/auth.service";
import { dispatchAuthChange } from "@/hooks/use-auth";

interface VerifyOtpSearch {
  email?: string;
  purpose?: "signup" | "reset";
}

export const Route = createFileRoute("/verify-otp")({
  validateSearch: (search: Record<string, unknown>): VerifyOtpSearch => {
    return {
      email: typeof search.email === "string" ? search.email : undefined,
      purpose: search.purpose === "reset" ? "reset" : "signup",
    };
  },
  head: () => ({ meta: [{ title: "Verify Code — ArchitectureNext" }] }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const search = useSearch({ from: "/verify-otp" });
  const navigate = useNavigate();

  const [email, setEmail] = useState(search.email || "");
  const [purpose] = useState<"signup" | "reset">(search.purpose || "signup");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // State for password reset stage 2 (Set new password)
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Ticking cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    if (!resetToken) {
      inputRefs.current[0]?.focus();
    }
  }, [resetToken]);

  const handleOtpChange = (index: number, value: string) => {
    const cleanDigits = value.replace(/\D/g, "");

    // Support iOS SMS / email auto-fill which inserts the whole 6-digit code at once
    if (cleanDigits.length > 1) {
      const newOtp = [...otp];
      const startIdx = cleanDigits.length >= 6 ? 0 : index;
      for (let i = 0; i < cleanDigits.length && startIdx + i < 6; i++) {
        newOtp[startIdx + i] = cleanDigits[i];
      }
      setOtp(newOtp);
      setErrorMsg("");

      const lastFilledIndex = Math.min(startIdx + cleanDigits.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();

      if (newOtp.every((digit) => digit.length === 1)) {
        submitOtp(newOtp.join(""));
      }
      return;
    }

    const cleanValue = cleanDigits.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);
    setErrorMsg("");

    // Auto-advance to next input
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits entered
    if (cleanValue && index === 5 && newOtp.every((digit) => digit.length === 1)) {
      submitOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    setErrorMsg("");

    const targetIndex = Math.min(pasted.length, 5);
    inputRefs.current[targetIndex]?.focus();

    if (pasted.length === 6) {
      submitOtp(pasted);
    }
  };

  const submitOtp = async (codeToSubmit?: string) => {
    const fullCode = codeToSubmit || otp.join("");
    if (fullCode.length !== 6) {
      setErrorMsg("Please enter all 6 digits of the verification code.");
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg("Email address is missing.");
      return;
    }

    setIsVerifying(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (purpose === "signup") {
        const res = await authService.verifyOtp({
          email: cleanEmail,
          otp: fullCode,
        });

        dispatchAuthChange();
        setSuccessMsg(res.message || "Account verified successfully!");

        setTimeout(() => {
          if (res.user?.role === "admin") {
            navigate({ to: "/admin" });
          } else if (res.user?.onboarded) {
            navigate({ to: "/" });
          } else {
            navigate({ to: "/onboarding" });
          }
        }, 1200);
      } else {
        // Password Reset flow
        const res = await authService.verifyResetOtp({
          email: cleanEmail,
          otp: fullCode,
        });

        setResetToken(res.resetToken);
        setSuccessMsg("Code verified! Please set your new password below.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Invalid or expired verification code.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (resendCooldown > 0 || !cleanEmail) return;
    setIsResending(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await authService.resendOtp({
        email: cleanEmail,
        purpose: purpose === "reset" ? "PASSWORD_RESET" : "SIGNUP_VERIFY",
      });
      setSuccessMsg(res.message || "New code sent to your email!");
      setResendCooldown(30);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) return;

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsResetting(true);
    setErrorMsg("");

    try {
      const res = await authService.resetPassword({
        resetToken,
        newPassword,
      });

      setResetComplete(true);
      setSuccessMsg(res.message || "Password updated successfully!");

      setTimeout(() => {
        navigate({ to: "/auth" });
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to reset password. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2 bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Left Visual Column */}
      <div className="hidden bg-gradient-hero p-12 md:flex md:flex-col md:justify-between border-r border-border/60 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand-blue/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-brand-purple/20 blur-[120px]" />

        <BrandLogo size="lg" />

        <div className="relative space-y-6 max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
            <ShieldCheck className="h-4 w-4" /> Secure Verification
          </span>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-foreground tracking-tight">
            {purpose === "signup" ? "Verify your email address." : "Reset your password securely."}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            We prioritize your account security. Single-use 6-digit codes ensure only verified students and professionals access the ArchitectureNext portal.
          </p>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-3 text-sm font-medium text-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <span>Instant email delivery via secure SMTP</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <span>Time-limited single-use security tokens</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} ArchitectureNext Education. All rights reserved.
        </div>
      </div>

      {/* Right Interaction Column */}
      <div className="flex flex-col items-center justify-center p-4 sm:p-8 lg:p-14 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div className="md:hidden flex justify-center w-full mb-2">
            <BrandLogo size="md" />
          </div>

          {!resetToken ? (
            /* STAGE 1: ENTER 6-DIGIT OTP */
            <>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="h-4 w-4" /> 6-Digit Verification
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {purpose === "signup" ? "Check your email" : "Enter reset code"}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  We've sent a 6-digit verification code to{" "}
                  <strong className="text-foreground break-all">{email || "your email address"}</strong>.
                </p>
              </div>

              {!email && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2.5 rounded-xl border border-input bg-surface px-3.5 py-1">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      inputMode="email"
                      className="border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 text-sm h-10 tracking-wide font-medium"
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-3.5 text-xs font-semibold text-primary flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-6">
                {/* 6 Digit Input Boxes - responsive square layout with iOS auto-fill */}
                <div className="grid grid-cols-6 gap-2 sm:gap-3 w-full max-w-sm mx-auto" onPaste={handlePaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={idx === 0 ? "one-time-code" : "off"}
                      pattern="[0-9]*"
                      maxLength={idx === 0 ? 6 : 1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="aspect-square w-full min-w-0 max-w-[54px] mx-auto rounded-xl sm:rounded-2xl border-2 border-border/80 bg-card text-center font-mono text-xl sm:text-2xl font-extrabold text-foreground shadow-xs transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                    />
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={() => submitOtp()}
                  disabled={isVerifying || otp.join("").length !== 6}
                  className="min-h-[48px] h-12 w-full bg-gradient-primary text-base font-bold text-primary-foreground shadow-soft transition-all hover:brightness-110 rounded-xl"
                >
                  {isVerifying ? "Verifying code..." : "Verify Code"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                {/* Resend Action */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground border-t border-border pt-4">
                  <span>Didn't receive the code?</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isResending}
                    className="inline-flex min-h-[44px] items-center gap-1.5 font-bold text-primary hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isResending ? "animate-spin" : ""}`} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* STAGE 2: SET NEW PASSWORD (FORGOT PASSWORD FLOW) */
            <>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <Lock className="h-4 w-4" /> Final Step
                </div>
                <h2 className="font-display text-3xl font-extrabold text-foreground tracking-tight">
                  Set New Password
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your identity has been verified. Choose a strong password for your account.
                </p>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-3.5 text-xs font-semibold text-primary flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {!resetComplete ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      New Password
                    </label>
                    <div className="flex items-center gap-2.5 rounded-xl border border-input bg-surface px-3.5 py-1 focus-within:ring-2 focus-within:ring-ring transition-all relative">
                      <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setErrorMsg("");
                        }}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className="border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 text-sm h-10 tracking-wide font-medium pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="flex items-center gap-2.5 rounded-xl border border-input bg-surface px-3.5 py-1 focus-within:ring-2 focus-within:ring-ring transition-all relative">
                      <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setErrorMsg("");
                        }}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className="border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 text-sm h-10 tracking-wide font-medium pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isResetting}
                    className="min-h-[48px] h-12 w-full bg-gradient-primary text-base font-bold text-primary-foreground shadow-soft transition-all hover:brightness-110 rounded-xl"
                  >
                    {isResetting ? "Updating password..." : "Update Password"} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-4 pt-4">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Password updated! Redirecting you to sign in...
                  </p>
                  <Button asChild className="min-h-[48px] h-12 w-full bg-gradient-primary text-primary-foreground font-bold rounded-xl shadow-soft">
                    <Link to="/auth">Sign In Now</Link>
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Classic Redesigned Return to Sign In (Single Clean Instance) */}
          <div className="border-t border-border/80 pt-6 text-center">
            <Link
              to="/auth"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary bg-muted/40 hover:bg-primary/10 border border-border/60 hover:border-primary/25 transition-all duration-200 group shadow-2xs hover:shadow-xs"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:-translate-x-1" />
              <span>Return to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
