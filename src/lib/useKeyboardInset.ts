import { useEffect, useRef, useState } from "react";
import { KEYBOARD_THRESHOLD_PX } from "../constants/uiTuning";

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
  const orientationRef = useRef<"portrait" | "landscape" | null>(null);

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

    const updateInset = (reason: "init" | "resize" | "scroll" | "orientationchange" = "init"): void => {
      const visibleHeight = viewport.height + viewport.offsetTop;
      const orientation = viewport.width >= viewport.height ? "landscape" : "portrait";
      const orientationChanged = orientationRef.current !== null && orientationRef.current !== orientation;

      const shouldRebaseline =
        reason === "orientationchange" ||
        orientationChanged ||
        baselineRef.current === 0 ||
        visibleHeight > baselineRef.current ||
        baselineRef.current - visibleHeight < KEYBOARD_THRESHOLD_PX;

      if (shouldRebaseline) {
        baselineRef.current = visibleHeight;
      }
      orientationRef.current = orientation;

      const rawInset = Math.max(0, baselineRef.current - visibleHeight);
      setInset(rawInset >= KEYBOARD_THRESHOLD_PX ? Math.round(rawInset) : 0);
    };

    updateInset("init");

    const onResize = (): void => updateInset("resize");
    const onScroll = (): void => updateInset("scroll");
    const onOrientationChange = (): void => updateInset("orientationchange");

    viewport.addEventListener("resize", onResize);
    viewport.addEventListener("scroll", onScroll);
    window.addEventListener("orientationchange", onOrientationChange);

    return () => {
      viewport.removeEventListener("resize", onResize);
      viewport.removeEventListener("scroll", onScroll);
      window.removeEventListener("orientationchange", onOrientationChange);
    };
  }, []);

  return inset;
}
