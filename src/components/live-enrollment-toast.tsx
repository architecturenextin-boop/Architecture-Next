import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface LiveEnrollmentPayload {
  studentName?: string;
  name?: string;
}

export interface LiveEnrollmentToastProps {
  /** Optional custom socket instance (Socket.IO or custom event emitter) */
  socket?: {
    on: (event: string, callback: (data: LiveEnrollmentPayload) => void) => void;
    off?: (event: string, callback: (data: LiveEnrollmentPayload) => void) => void;
    removeListener?: (event: string, callback: (data: LiveEnrollmentPayload) => void) => void;
  };
  /** Optional custom WebSocket URL */
  wsUrl?: string;
  /** Toast display duration in milliseconds (default: 3000ms) */
  duration?: number;
}

/**
 * Global helper to imperatively trigger a live enrollment notification
 * Useful for simulated events or direct app dispatches.
 */
export function triggerLiveEnrollment(studentName: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<LiveEnrollmentPayload>("enrollment_created", {
        detail: { studentName },
      })
    );
  }
}

/**
 * Minimal Apple-style floating live enrollment pill notification.
 * Appears top-center with green pulse dot + 'Live' and auto-hides after 3 seconds.
 */
export function LiveEnrollmentToast({
  socket,
  wsUrl,
  duration = 3000,
}: LiveEnrollmentToastProps) {
  const [current, setCurrent] = useState<{ id: number; firstName: string } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showEnrollment = (studentName?: string) => {
    if (!studentName) return;
    // Extract only the latest person's first name
    const firstName = studentName.trim().split(/\s+/)[0] || "Someone";

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Replace current name smoothly without stacking
    setCurrent({ id: Date.now(), firstName });

    // Auto-hide after 3 seconds
    timerRef.current = setTimeout(() => {
      setCurrent(null);
    }, duration);
  };

  useEffect(() => {
    // 1. Listen via passed socket prop or global window.socket
    const activeSocket = socket || (typeof window !== "undefined" ? (window as any).socket : null);
    const handleSocketEvent = (data: LiveEnrollmentPayload) => {
      showEnrollment(data?.studentName || data?.name);
    };

    if (activeSocket?.on) {
      activeSocket.on("enrollment_created", handleSocketEvent);
    }

    // 2. Listen via browser CustomEvent for interoperability
    const handleCustomEvent = (event: Event) => {
      const custom = event as CustomEvent<LiveEnrollmentPayload>;
      showEnrollment(custom.detail?.studentName || custom.detail?.name);
    };
    window.addEventListener("enrollment_created", handleCustomEvent);

    // 3. Connect via standard WebSocket if URL is provided
    let ws: WebSocket | null = null;
    if (wsUrl) {
      try {
        ws = new WebSocket(wsUrl);
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data?.event === "enrollment_created" || data?.type === "enrollment_created") {
              showEnrollment(data.studentName || data.name || data.data?.studentName);
            }
          } catch {
            // Non-JSON message ignored
          }
        };
      } catch {
        // Safe fallback if ws connection fails
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("enrollment_created", handleCustomEvent);
      if (activeSocket?.off) {
        activeSocket.off("enrollment_created", handleSocketEvent);
      } else if (activeSocket?.removeListener) {
        activeSocket.removeListener("enrollment_created", handleSocketEvent);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [socket, wsUrl, duration]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed top-4 inset-x-0 z-[100] flex justify-center px-4"
    >
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{
              duration: 0.25,
              ease: [0.16, 1, 0.3, 1], // Apple-style smooth deceleration
            }}
            className="inline-flex max-w-[90vw] items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-foreground shadow-md backdrop-blur-xl transition-colors dark:bg-card/85 dark:border-border/80"
          >
            {/* Green Pulsing Dot + Live Badge */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Live
              </span>
            </div>

            {/* Subtle separator */}
            <span className="h-3 w-px bg-border/80 shrink-0" aria-hidden="true" />

            {/* Notification Text */}
            <span className="truncate text-foreground/90">
              <strong className="font-semibold text-foreground">{current.firstName}</strong>{" "}
              just enrolled
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
