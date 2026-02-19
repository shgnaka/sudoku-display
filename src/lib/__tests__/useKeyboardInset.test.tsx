import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useKeyboardInset } from "../useKeyboardInset";

interface ViewportMock {
  offsetTop: number;
  height: number;
  addEventListener: (event: "resize" | "scroll", cb: () => void) => void;
  removeEventListener: (event: "resize" | "scroll", cb: () => void) => void;
  emit: (event: "resize" | "scroll") => void;
}

function createViewportMock(height: number, offsetTop = 0): ViewportMock {
  const listeners: Record<"resize" | "scroll", Array<() => void>> = {
    resize: [],
    scroll: []
  };

  return {
    height,
    offsetTop,
    addEventListener: (event, cb) => {
      listeners[event].push(cb);
    },
    removeEventListener: (event, cb) => {
      listeners[event] = listeners[event].filter((listener) => listener !== cb);
    },
    emit: (event) => {
      for (const cb of listeners[event]) {
        cb();
      }
    }
  };
}

function setTouchEnvironment(touchPoints: number, coarsePointer: boolean): void {
  Object.defineProperty(navigator, "maxTouchPoints", {
    configurable: true,
    value: touchPoints
  });

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: coarsePointer,
      media: "(pointer: coarse)",
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    }))
  });
}

describe("useKeyboardInset", () => {
  const originalVisualViewport = window.visualViewport;

  beforeEach(() => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: originalVisualViewport
    });
  });

  it("returns 0 on non-touch/coarse devices", () => {
    setTouchEnvironment(0, false);

    const viewport = createViewportMock(800);
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: viewport as unknown as VisualViewport
    });

    const { result } = renderHook(() => useKeyboardInset());

    act(() => {
      viewport.height = 560;
      viewport.emit("resize");
    });

    expect(result.current).toBe(0);
  });

  it("computes keyboard inset from visual viewport on touch devices", () => {
    setTouchEnvironment(5, true);

    const viewport = createViewportMock(800);
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: viewport as unknown as VisualViewport
    });

    const { result } = renderHook(() => useKeyboardInset());

    expect(result.current).toBe(0);

    act(() => {
      viewport.height = 560;
      viewport.emit("resize");
    });

    expect(result.current).toBe(240);
  });

  it("ignores small viewport deltas below threshold", () => {
    setTouchEnvironment(5, true);

    const viewport = createViewportMock(800);
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: viewport as unknown as VisualViewport
    });

    const { result } = renderHook(() => useKeyboardInset());

    act(() => {
      viewport.height = 740;
      viewport.emit("resize");
    });

    expect(result.current).toBe(0);
  });

  it("returns 0 when visualViewport is not available", () => {
    setTouchEnvironment(5, true);

    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: undefined
    });

    const { result } = renderHook(() => useKeyboardInset());

    expect(result.current).toBe(0);
  });

  it("cleans up viewport listeners on unmount", () => {
    setTouchEnvironment(5, true);

    const viewport = createViewportMock(800);
    const removeSpy = vi.spyOn(viewport, "removeEventListener");

    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: viewport as unknown as VisualViewport
    });

    const { unmount } = renderHook(() => useKeyboardInset());
    unmount();

    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});
