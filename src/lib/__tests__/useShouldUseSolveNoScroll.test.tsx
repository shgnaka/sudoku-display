import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { installMockMatchMedia } from "../../test-utils/browserMocks";
import {
  computeShouldUseSolveNoScroll,
  isIPadLikeDevice,
  useShouldUseSolveNoScroll
} from "../useShouldUseSolveNoScroll";

describe("isIPadLikeDevice", () => {
  it("detects iPad user agent", () => {
    expect(
      isIPadLikeDevice({
        userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)",
        platform: "iPad",
        maxTouchPoints: 5
      })
    ).toBe(true);
  });

  it("detects iPadOS desktop-class user agent on MacIntel with touch", () => {
    expect(
      isIPadLikeDevice({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)",
        platform: "MacIntel",
        maxTouchPoints: 5
      })
    ).toBe(true);
  });

  it("does not detect normal desktop mac as iPad", () => {
    expect(
      isIPadLikeDevice({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)",
        platform: "MacIntel",
        maxTouchPoints: 0
      })
    ).toBe(false);
  });
});

describe("computeShouldUseSolveNoScroll", () => {
  it("returns true only for solve route on mobile non-iPad devices", () => {
    expect(computeShouldUseSolveNoScroll(true, true, false)).toBe(true);
    expect(computeShouldUseSolveNoScroll(false, true, false)).toBe(false);
    expect(computeShouldUseSolveNoScroll(true, false, false)).toBe(false);
    expect(computeShouldUseSolveNoScroll(true, true, true)).toBe(false);
  });
});

describe("useShouldUseSolveNoScroll", () => {
  it("returns false on iPad-like device even when mobile media query matches", () => {
    installMockMatchMedia((query) => ({ matches: query === "(max-width: 768px)" }));

    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)"
    });
    Object.defineProperty(window.navigator, "platform", {
      configurable: true,
      value: "iPad"
    });
    Object.defineProperty(window.navigator, "maxTouchPoints", {
      configurable: true,
      value: 5
    });

    const { result } = renderHook(() => useShouldUseSolveNoScroll(true));
    expect(result.current).toBe(false);
  });

  it("returns true on iPhone-like device when mobile media query matches and route is solve", () => {
    installMockMatchMedia((query) => ({ matches: query === "(max-width: 768px)" }));

    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
    });
    Object.defineProperty(window.navigator, "platform", {
      configurable: true,
      value: "iPhone"
    });
    Object.defineProperty(window.navigator, "maxTouchPoints", {
      configurable: true,
      value: 5
    });

    const { result } = renderHook(() => useShouldUseSolveNoScroll(true));
    expect(result.current).toBe(true);
  });

  it("returns false on non-solve route", () => {
    installMockMatchMedia((query) => ({ matches: query === "(max-width: 768px)" }));

    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
    });
    Object.defineProperty(window.navigator, "platform", {
      configurable: true,
      value: "iPhone"
    });
    Object.defineProperty(window.navigator, "maxTouchPoints", {
      configurable: true,
      value: 5
    });

    const { result } = renderHook(() => useShouldUseSolveNoScroll(false));
    expect(result.current).toBe(false);
  });
});
