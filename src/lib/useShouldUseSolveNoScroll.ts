import { useMemo } from "react";
import { useIsMobileViewport } from "./useIsMobileViewport";

interface NavigatorLike {
  userAgent: string;
  platform: string;
  maxTouchPoints?: number;
}

export function isIPadLikeDevice(navigatorLike: NavigatorLike): boolean {
  const userAgent = navigatorLike.userAgent ?? "";
  if (/\biPad\b/i.test(userAgent)) {
    return true;
  }

  const isMacPlatform = navigatorLike.platform === "MacIntel";
  const maxTouchPoints = navigatorLike.maxTouchPoints ?? 0;
  return isMacPlatform && maxTouchPoints > 1;
}

function getIsIPadLikeDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return isIPadLikeDevice(navigator);
}

export function computeShouldUseSolveNoScroll(
  isSolveRoute: boolean,
  isMobileViewport: boolean,
  isIPadLike: boolean
): boolean {
  return isSolveRoute && isMobileViewport && !isIPadLike;
}

export function useShouldUseSolveNoScroll(isSolveRoute: boolean): boolean {
  const isMobileViewport = useIsMobileViewport();
  const isIPadLike = useMemo(() => getIsIPadLikeDevice(), []);

  return computeShouldUseSolveNoScroll(isSolveRoute, isMobileViewport, isIPadLike);
}
