import React, { useState } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
  const navigate = useNavigate();

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

  return (
    <div className="relative w-full flex flex-col items-center justify-center">
      <div
        className={`w-full flex justify-center transition-all ${
          isLoading ? "opacity-40 pointer-events-none" : ""
        }`}
      >
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          text={text}
          shape={shape}
          size={size}
          theme={theme}
          width={width || "360"}
          logo_alignment="center"
          useOneTap={false}
        />
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-xl z-10 transition-all">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-surface border border-border/80 px-3.5 py-2 rounded-xl shadow-soft">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Verifying Google account...</span>
          </div>
        </div>
      )}
    </div>
  );
}
