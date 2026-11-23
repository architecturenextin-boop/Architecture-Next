import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, ArrowLeft, AtSign, Lock, User, Phone as PhoneIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brand } from "@/lib/brand";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { AuthTestimonial } from "@/components/auth-testimonial";
import { authService } from "@/lib/services/auth.service";
import heroImg from "@/assets/hero-learner.jpeg";

interface SignupSearch {
  redirect?: string;
}

function getSafeRedirect(redirect?: string): string | null {
  if (!redirect) return null;
  if (redirect.startsWith("/") && !redirect.startsWith("//") && !redirect.includes("javascript:")) {
    return redirect;
  }
  return null;
}

export const Route = createLazyFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const search = Route.useSearch();
  const safeRedirect = getSafeRedirect(search.redirect);

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
        search: {
          email: email.trim(),
          purpose: "signup",
          redirect: safeRedirect || undefined,
        },
      });
    } catch (error: any) {
      setIsLoading(false);
      setErr(error?.message || "An error occurred during registration.");
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
              Start your architecture &amp; interior design learning journey
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

      {/* Right Panel: Clean, Spacious Registration Form */}
      <div className="relative z-20 -mt-6 lg:mt-0 rounded-t-[28px] lg:rounded-none bg-background border-t border-border/40 lg:border-t-0 flex flex-col justify-between p-6 sm:p-10 lg:p-12 min-h-screen lg:min-h-full overflow-y-auto">
        <div className="mx-auto flex w-full flex-col justify-center my-auto max-w-[420px] sm:max-w-[460px]">
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

          <div className="mb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Sign In or Join Now!
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
              Create your ArchitectureNext student account.
            </p>
          </div>

          {/* Preferred route in: Google first, email as the fallback */}
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-3 sm:p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Recommended
              </p>
              <span className="text-[10px] font-semibold text-primary">Fastest sign up</span>
            </div>
            <div className="w-full max-w-full min-w-0">
              <GoogleAuthButton
                redirect={safeRedirect || undefined}
                text="signup_with"
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

          {/* Email Registration Form */}
          <form onSubmit={submit} className="space-y-3.5">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              Enter your details to create an account
            </p>

            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  First Name
                </label>
                <Input
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setErr("");
                  }}
                  placeholder="Rahul"
                  className="h-11 rounded-xl bg-background border-border/80 px-3.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Last Name
                </label>
                <Input
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setErr("");
                  }}
                  placeholder="Kumar"
                  className="h-11 rounded-xl bg-background border-border/80 px-3.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                  required
                />
              </div>
            </div>

            {/* Username & Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Username
                </label>
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
                  className="h-11 rounded-xl bg-background border-border/80 px-3.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Mobile (+91)
                </label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setErr("");
                  }}
                  placeholder="9876543210"
                  maxLength={14}
                  className="h-11 rounded-xl bg-background border-border/80 px-3.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <AtSign className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErr("");
                  }}
                  placeholder="your.email@example.com"
                  className="h-11 rounded-xl bg-background border-border/80 pl-10 pr-3.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                  required
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErr("");
                    }}
                    placeholder="••••••••"
                    className="h-11 rounded-xl bg-background border-border/80 px-3.5 pr-9 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErr("");
                    }}
                    placeholder="••••••••"
                    className="h-11 rounded-xl bg-background border-border/80 px-3.5 pr-9 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
              />
              <label htmlFor="agree" className="text-xs text-muted-foreground leading-snug cursor-pointer select-none">
                I agree to the{" "}
                <span className="font-semibold text-foreground">Terms of Service</span> and{" "}
                <span className="font-semibold text-foreground">Privacy Policy</span>.
              </label>
            </div>

            {err && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                {err}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#294398] to-[#643A91] hover:brightness-110 font-bold text-white shadow-sm transition-all rounded-xl text-base cursor-pointer mt-1"
            >
              {isLoading ? "Creating Account..." : "Continue With Email"}
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

          {/* Already have an account */}
          <div className="pt-4 text-center text-xs sm:text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/auth"
              search={safeRedirect ? { redirect: safeRedirect } : undefined}
              className="font-bold text-[#294398] dark:text-primary hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Bottom copyright footer */}
        <div className="pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ArchitectureNext. All rights reserved.
        </div>
      </div>
    </div>
  );
}
