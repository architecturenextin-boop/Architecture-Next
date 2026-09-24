import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowLeft, Phone, Sparkles, User, Mail, Lock, Eye, EyeOff, CheckCircle2, AtSign } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand-logo";
import { authService } from "@/lib/services/auth.service";
import { dispatchAuthChange } from "@/hooks/use-auth";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create Account — ArchitectureNext" }] }),
  component: SignupPage,
});

function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [err, setErr] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setErr("Please enter your first name");
      return;
    }
    if (!lastName.trim()) {
      setErr("Please enter your last name");
      return;
    }
    if (!username.trim()) {
      setErr("Please choose a username");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErr("Please enter a valid email address");
      return;
    }
    const rawDigits = phone.replace(/\D/g, "");
    const cleanPhone = rawDigits.length > 10 && rawDigits.startsWith("91") 
      ? rawDigits.slice(2) 
      : rawDigits.slice(-10);

    if (cleanPhone.length !== 10) {
      setErr("Enter a valid 10-digit mobile number");
      return;
    }
    if (!password) {
      setErr("Please enter a password");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setErr("Passwords do not match");
      return;
    }
    if (!agreed) {
      setErr("You must agree to the Terms & Privacy Policy to continue");
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    
    setIsLoading(true);
    setErr("");

    try {
      const res = await authService.register({
        email: email.trim(),
        password: password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: fullName,
        username: username.trim(),
        phone: cleanPhone,
      });

      setIsLoading(false);
      navigate({
        to: "/verify-otp",
        search: { email: email.trim(), purpose: "signup" },
      });
    } catch (error: any) {
      setIsLoading(false);
      setErr(error?.message || "An error occurred during registration.");
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-12 bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Left Branding Showcase (Desktop - 5 Cols) */}
      
      <div className="hidden md:col-span-5 bg-gradient-hero p-10 lg:p-12 md:flex md:flex-col md:justify-between border-r border-border/60 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand-blue/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-brand-purple/20 blur-[120px]" />
        <BrandLogo size="lg" />
      

        <div className="relative space-y-6 max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
            Start Your Journey Today
          </span>
          <h1 className="font-display text-3xl lg:text-4xl font-extrabold leading-tight text-foreground tracking-tight">
            Level up your career in Architecture &amp; BIM Design.
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
            Join 10,000+ students &amp; professionals mastering industry-standard CAD, Revit, 3D Rendering, and AI workflows.
          </p>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-3 text-sm font-medium text-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <span>Lifetime access to course materials &amp; project assets</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <span>Verifiable Certificate signed by practicing architects</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <span>Dedicated Discord community &amp; mentor guidance</span>
            </div>
          </div>
        </div>

        <div className="relative text-xs font-medium text-muted-foreground">
          © {new Date().getFullYear()} ArchitectureNext. All rights reserved.
        </div>
      </div>

      {/* Right Signup Form (7 Cols) */}
      <div className="md:col-span-7 flex flex-col items-center justify-start sm:justify-center p-4 sm:p-8 md:p-10 lg:p-12 pt-6 sm:pt-10 pb-12 sm:pb-16 relative overflow-y-auto">
        <div className="w-full max-w-lg space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between w-full pb-1">
            <div className="md:hidden">
              <BrandLogo size="sm" />
            </div>
            <Link
              to="/"
              className="inline-flex min-h-[36px] items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-primary bg-muted/40 hover:bg-primary/10 border border-border/60 hover:border-primary/25 transition-all group ml-auto"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
              <span>Back to Home</span>
            </Link>
          </div>

          <div>
          {isSubmitted ? (
            <div className="space-y-5 text-center py-6">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
                  Check your email
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-normal">
                  We've sent a verification link to <span className="font-semibold text-foreground">{email}</span>. Please click the link to confirm your account and log in.
                </p>
              </div>
              <Button asChild size="lg" className="w-full min-h-[46px] h-11 sm:h-12 bg-gradient-primary font-bold text-primary-foreground shadow-soft transition-all hover:shadow-elevated rounded-xl">
                <Link to="/auth">Go to Login</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1 mb-4">
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                  Create your account
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-normal">
                  Fill in your details to register and start learning.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-3 sm:space-y-3.5">
            {/* First Name & Last Name (2 columns on mobile & desktop) */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  First Name
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-input bg-surface px-3 py-1 focus-within:ring-2 focus-within:ring-ring transition-all">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setErr("");
                    }}
                    placeholder="Rahul"
                    className="border-0 bg-transparent px-0.5 shadow-none focus-visible:ring-0 text-sm h-9 sm:h-10 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Last Name
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-input bg-surface px-3 py-1 focus-within:ring-2 focus-within:ring-ring transition-all">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setErr("");
                    }}
                    placeholder="Kumar"
                    className="border-0 bg-transparent px-0.5 shadow-none focus-visible:ring-0 text-sm h-9 sm:h-10 font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Username & Email (1 column mobile, 2 col sm+) */}
            <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3.5">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Username
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-input bg-surface px-3 py-1 focus-within:ring-2 focus-within:ring-ring transition-all">
                  <AtSign className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
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
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Email Address
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-input bg-surface px-3 py-1 focus-within:ring-2 focus-within:ring-ring transition-all">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErr("");
                    }}
                    placeholder="rahul@example.com"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="email"
                    className="border-0 bg-transparent px-0.5 shadow-none focus-visible:ring-0 text-sm h-9 sm:h-10 font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Mobile Number
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

            {/* Password & Confirm Password (2 columns on mobile & desktop) */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Password
                </label>
                <div className="flex items-center gap-1.5 rounded-xl border border-input bg-surface px-2.5 sm:px-3 py-1 focus-within:ring-2 focus-within:ring-ring transition-all relative">
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErr("");
                    }}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="border-0 bg-transparent px-0.5 shadow-none focus-visible:ring-0 text-sm h-9 sm:h-10 font-medium pr-6"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Confirm Password
                </label>
                <div className="flex items-center gap-1.5 rounded-xl border border-input bg-surface px-2.5 sm:px-3 py-1 focus-within:ring-2 focus-within:ring-ring transition-all relative">
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErr("");
                    }}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="border-0 bg-transparent px-0.5 shadow-none focus-visible:ring-0 text-sm h-9 sm:h-10 font-medium pr-6"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-2 pt-0.5">
              <input
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer shrink-0"
              />
              <label htmlFor="agree" className="text-xs text-muted-foreground leading-snug cursor-pointer select-none">
                I agree to ArchitectureNext's{" "}
                <a href="#" onClick={(e) => e.preventDefault()} className="font-semibold text-foreground hover:underline">Terms of Service</a>{" "}
                and{" "}
                <a href="#" onClick={(e) => e.preventDefault()} className="font-semibold text-foreground hover:underline">Privacy Policy</a>.
              </label>
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
              className="w-full min-h-[46px] h-11 sm:h-12 bg-gradient-primary font-bold text-primary-foreground shadow-soft transition-all hover:shadow-elevated hover:brightness-110 mt-1 rounded-xl text-sm sm:text-base cursor-pointer"
            >
              {isLoading ? "Creating Account..." : "Create Account"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Already have an account */}
          <div className="border-t border-border pt-4 text-center text-xs sm:text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth" className="font-bold text-primary hover:underline">
              Sign in
            </Link>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
