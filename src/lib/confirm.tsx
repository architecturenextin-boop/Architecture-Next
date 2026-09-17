import React from "react";
import { toast } from "sonner";
import { AlertTriangle, Trash2, HelpCircle } from "lucide-react";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "destructive" | "primary" | "warning";
}

/**
 * Modern in-app snackbar confirmation dialog replacing native window.confirm ("localhost:says...")
 */
export function confirmAction({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "destructive",
}: ConfirmOptions) {
  toast.custom(
    (t) => (
      <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 shadow-2xl text-foreground w-[360px] animate-in fade-in slide-in-from-top-2">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              variant === "destructive"
                ? "bg-destructive/10 text-destructive"
                : variant === "warning"
                ? "bg-amber-500/10 text-amber-500"
                : "bg-primary/10 text-primary"
            }`}
          >
            {variant === "destructive" ? (
              <Trash2 className="h-4.5 w-4.5" />
            ) : variant === "warning" ? (
              <AlertTriangle className="h-4.5 w-4.5" />
            ) : (
              <HelpCircle className="h-4.5 w-4.5" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold leading-tight text-foreground">{title}</h4>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
            )}
          </div>
        </div>
        <div className="mt-1 flex items-center justify-end gap-2 pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={() => toast.dismiss(t)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={async () => {
              toast.dismiss(t);
              await onConfirm();
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition shadow-sm cursor-pointer ${
              variant === "destructive"
                ? "bg-destructive hover:bg-destructive/90"
                : variant === "warning"
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    ),
    {
      duration: 10000,
    }
  );
}
