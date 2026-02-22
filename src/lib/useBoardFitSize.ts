import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { DEFAULT_MIN_BOARD_SIZE } from "../constants/uiTuning";

export function computeBoardFitSize(width: number, height: number, minSize: number): number {
  if (width <= 0 || height <= 0) {
    return 0;
  }

  return Math.max(minSize, Math.floor(Math.min(width, height)));
}

interface UseBoardFitSizeOptions {
  enabled: boolean;
  minSize?: number;
}

export function useBoardFitSize(
  ref: RefObject<HTMLElement>,
  { enabled, minSize = DEFAULT_MIN_BOARD_SIZE }: UseBoardFitSizeOptions
): number | null {
  const [fitSize, setFitSize] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setFitSize(null);
      return;
    }

    const element = ref.current;
    if (!element) {
      setFitSize(null);
      return;
    }

    const syncSize = (): void => {
      const nextSize = computeBoardFitSize(element.clientWidth, element.clientHeight, minSize);
      setFitSize((current) => (current === nextSize ? current : nextSize));
    };

    syncSize();
    window.addEventListener("resize", syncSize);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(syncSize);
      observer.observe(element);
    }

    return () => {
      window.removeEventListener("resize", syncSize);
      observer?.disconnect();
    };
  }, [enabled, minSize, ref]);

  return fitSize;
}
