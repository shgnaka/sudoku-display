import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
