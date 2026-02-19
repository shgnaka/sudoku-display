import { useEffect, useRef, useState } from "react";

const KEYBOARD_THRESHOLD_PX = 80;

function isCoarsePointerDevice(): boolean {
  const hasTouch = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
  const coarsePointer =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(pointer: coarse)").matches
      : false;

  return hasTouch || coarsePointer;
}

export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  const baselineRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!isCoarsePointerDevice()) {
      setInset(0);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      setInset(0);
      return;
    }

    const updateInset = (): void => {
      const visibleHeight = viewport.height + viewport.offsetTop;
      baselineRef.current = Math.max(baselineRef.current, visibleHeight);

      const rawInset = Math.max(0, baselineRef.current - visibleHeight);
      setInset(rawInset >= KEYBOARD_THRESHOLD_PX ? Math.round(rawInset) : 0);
    };

    updateInset();

    viewport.addEventListener("resize", updateInset);
    viewport.addEventListener("scroll", updateInset);
    window.addEventListener("orientationchange", updateInset);

    return () => {
      viewport.removeEventListener("resize", updateInset);
      viewport.removeEventListener("scroll", updateInset);
      window.removeEventListener("orientationchange", updateInset);
    };
  }, []);

  return inset;
}
