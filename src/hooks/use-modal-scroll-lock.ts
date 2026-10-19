import { useEffect, type RefObject } from "react";

interface UseModalScrollLockOptions {
  scrollContainerRef?: RefObject<HTMLElement | null>;
  modalRootRef?: RefObject<HTMLElement | null>;
}

/**
 * Universal hook to lock background scrolling and guarantee 100% reliable
 * scrolling inside modals, preventing scroll leak / chaining to the background.
 */
export function useModalScrollLock(
  isOpen: boolean,
  options?: UseModalScrollLockOptions
) {
  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    // 1. Lock document.body and html
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyOverscroll = document.body.style.overscrollBehavior;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    // Calculate scrollbar width to prevent layout jump
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";
    document.documentElement.style.overflow = "hidden";
    document.body.classList.add("modal-open");
    document.body.setAttribute("data-modal-open", "true");

    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    // 2. Pause global Lenis smooth scroll
    try {
      (window as any).lenis?.stop();
    } catch (_) {}

    // 3. Setup scroll isolation and wheel delegation
    const scrollEl = options?.scrollContainerRef?.current;
    const modalRootEl = options?.modalRootRef?.current;

    let onContainerWheel: ((e: WheelEvent) => void) | null = null;
    let onRootWheel: ((e: WheelEvent) => void) | null = null;

    if (scrollEl) {
      // Auto-focus container so keyboard navigation (PageUp/Down, Space, Arrows) works inside modal
      try {
        scrollEl.focus({ preventScroll: true });
      } catch (_) {}

      onContainerWheel = (e: WheelEvent) => {
        // Prevent wheel event from bubbling to window / body / Lenis
        e.stopPropagation();
      };

      scrollEl.addEventListener("wheel", onContainerWheel, { passive: true });
    }

    if (modalRootEl && scrollEl) {
      onRootWheel = (e: WheelEvent) => {
        // If wheel event happened outside the scroll container (e.g. on modal header, footer, padding),
        // forward the scroll to scrollEl so the user can scroll from anywhere on the modal
        if (!scrollEl.contains(e.target as Node)) {
          scrollEl.scrollTop += e.deltaY;
          e.preventDefault();
          e.stopPropagation();
        }
      };

      modalRootEl.addEventListener("wheel", onRootWheel, { passive: false });
    }

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.overscrollBehavior = prevBodyOverscroll;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      document.body.classList.remove("modal-open");
      document.body.removeAttribute("data-modal-open");

      if (scrollEl && onContainerWheel) {
        scrollEl.removeEventListener("wheel", onContainerWheel);
      }
      if (modalRootEl && onRootWheel) {
        modalRootEl.removeEventListener("wheel", onRootWheel);
      }

      // Resume global Lenis smooth scroll
      try {
        (window as any).lenis?.start();
      } catch (_) {}
    };
  }, [isOpen, options?.scrollContainerRef, options?.modalRootRef]);
}

