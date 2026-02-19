import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 768px)";

function getIsMobile(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(MOBILE_QUERY).matches;
}

export function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => getIsMobile());

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia(MOBILE_QUERY);
    const sync = (): void => {
      setIsMobile(media.matches);
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

  return isMobile;
}
