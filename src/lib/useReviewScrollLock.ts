import { useEffect, useRef } from "react";

export function useReviewScrollLock(enabled: boolean): void {
  const lockedYRef = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const viewport = window.visualViewport;
    const body = document.body;
    lockedYRef.current = window.scrollY;
    body.classList.add("review-scroll-lock");

    const enforceLock = (): void => {
      window.scrollTo(0, lockedYRef.current);
    };

    const preventMove = (event: Event): void => {
      event.preventDefault();
    };

    window.addEventListener("scroll", enforceLock, { passive: true });
    window.addEventListener("wheel", preventMove, { passive: false });
    window.addEventListener("touchmove", preventMove, { passive: false });
    viewport?.addEventListener("resize", enforceLock);
    viewport?.addEventListener("scroll", enforceLock);

    return () => {
      body.classList.remove("review-scroll-lock");
      window.removeEventListener("scroll", enforceLock);
      window.removeEventListener("wheel", preventMove);
      window.removeEventListener("touchmove", preventMove);
      viewport?.removeEventListener("resize", enforceLock);
      viewport?.removeEventListener("scroll", enforceLock);
    };
  }, [enabled]);
}
