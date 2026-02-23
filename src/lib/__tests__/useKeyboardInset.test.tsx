import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useKeyboardInset } from "../useKeyboardInset";
import {
  createMockVisualViewport,
  installMockMatchMedia,
  installMockVisualViewport
} from "../../test-utils/browserMocks";

function setTouchEnvironment(touchPoints: number, coarsePointer: boolean): void {
  Object.defineProperty(navigator, "maxTouchPoints", {
    configurable: true,
    value: touchPoints
  });

  installMockMatchMedia(() => ({
    matches: coarsePointer,
    media: "(pointer: coarse)"
  }));
}

describe("useKeyboardInset", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800
    });
  });

  it("returns 0 on non-touch/coarse devices", () => {
    setTouchEnvironment(0, false);

    const viewport = createMockVisualViewport(800);
    installMockVisualViewport(viewport);

    const { result } = renderHook(() => useKeyboardInset());

    act(() => {
      viewport.height = 560;
      viewport.emit("resize");
    });

    expect(result.current).toBe(0);
  });

  it("computes keyboard inset from visual viewport on touch devices", () => {
    setTouchEnvironment(5, true);

    const viewport = createMockVisualViewport(800);
    installMockVisualViewport(viewport);

    const { result } = renderHook(() => useKeyboardInset());

    expect(result.current).toBe(0);

    act(() => {
      viewport.height = 560;
      viewport.emit("resize");
    });

    expect(result.current).toBe(240);
  });

  it("re-baselines inset on orientation change when keyboard is hidden", () => {
    setTouchEnvironment(5, true);

    const viewport = createMockVisualViewport(800, 0, 390);
    installMockVisualViewport(viewport);

    const { result } = renderHook(() => useKeyboardInset());

    act(() => {
      viewport.height = 560;
      viewport.emit("resize");
    });

    expect(result.current).toBe(240);

    act(() => {
      viewport.width = 844;
      viewport.height = 390;
      window.dispatchEvent(new Event("orientationchange"));
    });

    expect(result.current).toBe(0);
  });

  it("ignores small viewport deltas below threshold", () => {
    setTouchEnvironment(5, true);

    const viewport = createMockVisualViewport(800);
    installMockVisualViewport(viewport);

    const { result } = renderHook(() => useKeyboardInset());

    act(() => {
      viewport.height = 740;
      viewport.emit("resize");
    });

    expect(result.current).toBe(0);
  });

  it("returns 0 when visualViewport is not available", () => {
    setTouchEnvironment(5, true);

    installMockVisualViewport(undefined);

    const { result } = renderHook(() => useKeyboardInset());

    expect(result.current).toBe(0);
  });

  it("cleans up viewport listeners on unmount", () => {
    setTouchEnvironment(5, true);

    const viewport = createMockVisualViewport(800);
    const removeSpy = vi.spyOn(viewport, "removeEventListener");

    installMockVisualViewport(viewport);

    const { unmount } = renderHook(() => useKeyboardInset());
    unmount();

    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});
