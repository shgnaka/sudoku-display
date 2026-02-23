import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  MOBILE_BREAKPOINT_PX,
  SOLVE_INPUT_SHEET_BREAKPOINT_PX,
  createMaxWidthMediaQuery
} from "../../constants/layout";
import { useIsMobileViewport } from "../useIsMobileViewport";
import { useSolveInputSheetViewport } from "../useSolveInputSheetViewport";
import { installMockMatchMedia } from "../../test-utils/browserMocks";

describe("viewport breakpoint sync", () => {
  it("builds stable max-width media queries from shared constants", () => {
    expect(createMaxWidthMediaQuery(MOBILE_BREAKPOINT_PX)).toBe("(max-width: 768px)");
    expect(createMaxWidthMediaQuery(SOLVE_INPUT_SHEET_BREAKPOINT_PX)).toBe("(max-width: 1024px)");
  });

  it("useIsMobileViewport subscribes with the shared mobile query", () => {
    const matchMediaMock = installMockMatchMedia(() => ({
      matches: false,
      media: ""
    }));

    renderHook(() => useIsMobileViewport());

    expect(matchMediaMock).toHaveBeenCalledWith("(max-width: 768px)");
  });

  it("useSolveInputSheetViewport subscribes with the shared sheet query", () => {
    const matchMediaMock = installMockMatchMedia(() => ({
      matches: true,
      media: ""
    }));

    renderHook(() => useSolveInputSheetViewport());

    expect(matchMediaMock).toHaveBeenCalledWith("(max-width: 1024px)");
  });

  it("falls back to addListener/removeListener when event listener APIs are missing", () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    const matchMediaMock = vi.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener,
      removeListener,
      addEventListener: undefined,
      removeEventListener: undefined,
      dispatchEvent: () => false
    }));

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: matchMediaMock
    });

    const { unmount } = renderHook(() => useSolveInputSheetViewport());
    expect(addListener).toHaveBeenCalledTimes(1);
    unmount();
    expect(removeListener).toHaveBeenCalledTimes(1);
  });

  it("returns false when matchMedia is unavailable", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: undefined
    });

    const { result: mobileResult } = renderHook(() => useIsMobileViewport());
    const { result: sheetResult } = renderHook(() => useSolveInputSheetViewport());

    expect(mobileResult.current).toBe(false);
    expect(sheetResult.current).toBe(false);
  });
});
