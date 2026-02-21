import { useEffect, useState } from "react";

const SOLVE_INPUT_SHEET_QUERY = "(max-width: 1024px)";

function getIsSheetViewport(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(SOLVE_INPUT_SHEET_QUERY).matches;
}

export function useSolveInputSheetViewport(): boolean {
  const [isSheetViewport, setIsSheetViewport] = useState<boolean>(() => getIsSheetViewport());

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia(SOLVE_INPUT_SHEET_QUERY);
    const sync = (): void => {
      setIsSheetViewport(media.matches);
    };

    sync();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync);
    } else {
      media.addListener(sync);
    }

    return () => {
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", sync);
      } else {
        media.removeListener(sync);
      }
    };
  }, []);

  return isSheetViewport;
}
