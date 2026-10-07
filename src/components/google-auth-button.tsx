import React, { useState, useEffect, useRef } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { authService } from "@/lib/services/auth.service";
import { dispatchAuthChange } from "@/hooks/use-auth";

interface GoogleAuthButtonProps {
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  size?: "large" | "medium" | "small";
  width?: string;
  theme?: "outline" | "filled_blue" | "filled_black";
}

export function GoogleAuthButton({
  text = "continue_with",
  shape = "rectangular",
  size = "large",
  theme = "outline",
  width,
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const clientWidth = containerRef.current.clientWidth;
        if (clientWidth > 0) {
          // Google iframe button width must be between 200px and 400px
          const targetWidth = Math.max(200, Math.min(Math.floor(clientWidth), 400));
          setContainerWidth(targetWidth);
        }
      }
    };

    updateWidth();
    const ro = new ResizeObserver(() => updateWidth());
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    window.addEventListener("resize", updateWidth);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      toast.error("Google authentication failed. No credentials received.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.googleLogin(response.credential);
      dispatchAuthChange();

      toast.success(
        res.isNewUser
          ? "Account created successfully with Google!"
          : "Signed in successfully!"
      );

      const user = res.user;
      if (user?.role === "admin") {
        navigate({ to: "/admin" });
      } else if (!user?.onboarded) {
        navigate({ to: "/onboarding" });
      } else {
        navigate({ to: "/" });
      }
    } catch (err: any) {
      console.error("[Google Auth Error]:", err);
      toast.error(err?.message || "Failed to authenticate with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = () => {
    console.error("[Google Login Error]: Prompt closed or failed");
    toast.error("Google sign-in was cancelled or encountered an error.");
    setIsLoading(false);
  };

  const effectiveWidth = width || (containerWidth ? String(containerWidth) : "320");

  return (
    <div ref={containerRef} className="relative w-full max-w-full min-w-0 flex flex-col items-center justify-center">
      <div
        className={`w-full max-w-full flex justify-center transition-all overflow-hidden ${
          isLoading ? "opacity-40 pointer-events-none" : ""
        }`}
      >
        <GoogleLogin
          key={effectiveWidth}
          onSuccess={handleSuccess}
          onError={handleError}
          text={text}
          shape={shape}
          size={size}
          theme={theme}
          width={effectiveWidth}
          logo_alignment="center"
          useOneTap={false}
        />
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[2px] rounded-xl z-10 transition-all">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-surface border border-border/80 px-3.5 py-2 rounded-xl shadow-soft">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Verifying Google account...</span>
          </div>
        </div>
      )}

      {/* Trust badge for mobile & desktop */}
      <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground select-none">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        <span>1-Tap Fast &amp; Secure Access</span>
      </div>
    </div>
  );
}
