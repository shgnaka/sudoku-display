import { useEffect, useRef } from "react";

interface UseKeyboardScrollLockParams {
  enabled: boolean;
  keyboardInset: number;
}

export function useKeyboardScrollLock({ enabled, keyboardInset }: UseKeyboardScrollLockParams): void {
  const lockedYRef = useRef(0);

  useEffect(() => {
    if (!enabled || keyboardInset <= 0 || typeof window === "undefined") {
      return;
    }

    const viewport = window.visualViewport;
    lockedYRef.current = window.scrollY;

    const enforceLock = (): void => {
      window.scrollTo(0, lockedYRef.current);
    };

    window.addEventListener("scroll", enforceLock, { passive: true });
    viewport?.addEventListener("resize", enforceLock);
    viewport?.addEventListener("scroll", enforceLock);

    return () => {
      window.removeEventListener("scroll", enforceLock);
      viewport?.removeEventListener("resize", enforceLock);
      viewport?.removeEventListener("scroll", enforceLock);
    };
  }, [enabled, keyboardInset]);
}
