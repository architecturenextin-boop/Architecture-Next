import { useEffect } from "react";

export function useSmoothScroll() {
  useEffect(() => {
    let lenisInstance: any = null;
    let rafId: number | null = null;

    import("lenis").then(({ default: Lenis }) => {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        prevent: (node) => {
          try {
            return (
              document.body.classList.contains("modal-open") ||
              document.body.style.overflow === "hidden" ||
              Boolean(node?.hasAttribute?.("data-lenis-prevent")) ||
              Boolean(node?.closest?.("[data-lenis-prevent]")) ||
              Boolean(node?.closest?.(".modal-scroll-container")) ||
              Boolean(node?.closest?.(".modal-overlay")) ||
              Boolean(node?.closest?.("[role='dialog']")) ||
              Boolean(node?.closest?.(".fixed.inset-0"))
            );
          } catch (_) {
            return false;
          }
        },
      });

      (window as any).lenis = lenis;
      lenisInstance = lenis;

      function raf(time: number) {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);
    });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenisInstance) {
        lenisInstance.destroy();
        (window as any).lenis = null;
      }
    };
  }, []);
}
