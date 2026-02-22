import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MOBILE_BREAKPOINT_PX,
  SOLVE_INPUT_SHEET_BREAKPOINT_PX,
  createMaxWidthMediaQuery
} from "../../constants/layout";
import { useIsMobileViewport } from "../useIsMobileViewport";
import { useSolveInputSheetViewport } from "../useSolveInputSheetViewport";

describe("viewport breakpoint sync", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia
    });
  });

  it("builds stable max-width media queries from shared constants", () => {
    expect(createMaxWidthMediaQuery(MOBILE_BREAKPOINT_PX)).toBe("(max-width: 768px)");
    expect(createMaxWidthMediaQuery(SOLVE_INPUT_SHEET_BREAKPOINT_PX)).toBe("(max-width: 1024px)");
  });

  it("useIsMobileViewport subscribes with the shared mobile query", () => {
    const matchMediaMock = vi.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    }));

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: matchMediaMock
    });

    renderHook(() => useIsMobileViewport());

    expect(matchMediaMock).toHaveBeenCalledWith("(max-width: 768px)");
  });

  it("useSolveInputSheetViewport subscribes with the shared sheet query", () => {
    const matchMediaMock = vi.fn().mockImplementation(() => ({
      matches: true,
      media: "",
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    }));

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: matchMediaMock
    });

    renderHook(() => useSolveInputSheetViewport());

    expect(matchMediaMock).toHaveBeenCalledWith("(max-width: 1024px)");
  });
});
