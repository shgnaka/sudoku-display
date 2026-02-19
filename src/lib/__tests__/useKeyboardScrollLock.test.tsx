import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useKeyboardScrollLock } from "../useKeyboardScrollLock";

function mockVisualViewport() {
  const listeners: Record<"resize" | "scroll", Array<() => void>> = {
    resize: [],
    scroll: []
  };

  return {
    addEventListener: (event: "resize" | "scroll", cb: () => void) => {
      listeners[event].push(cb);
    },
    removeEventListener: (event: "resize" | "scroll", cb: () => void) => {
      listeners[event] = listeners[event].filter((listener) => listener !== cb);
    },
    emit: (event: "resize" | "scroll") => {
      for (const cb of listeners[event]) {
        cb();
      }
    }
  };
}

describe("useKeyboardScrollLock", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 120
    });
  });

  it("does not lock scroll when disabled", () => {
    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    renderHook(() => useKeyboardScrollLock({ enabled: false, keyboardInset: 220 }));

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(scrollSpy).not.toHaveBeenCalled();
    scrollSpy.mockRestore();
  });

  it("locks window scroll when enabled and keyboard inset is positive", () => {
    const viewport = mockVisualViewport();
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: viewport as unknown as VisualViewport
    });

    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    renderHook(() => useKeyboardScrollLock({ enabled: true, keyboardInset: 220 }));

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 560
    });

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(scrollSpy).toHaveBeenCalledWith(0, 120);

    act(() => {
      viewport.emit("resize");
    });

    expect(scrollSpy).toHaveBeenLastCalledWith(0, 120);
    scrollSpy.mockRestore();
  });

  it("removes lock after disable", () => {
    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    const { rerender } = renderHook(
      ({ enabled, keyboardInset }) => useKeyboardScrollLock({ enabled, keyboardInset }),
      {
        initialProps: { enabled: true, keyboardInset: 220 }
      }
    );

    rerender({ enabled: false, keyboardInset: 220 });

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(scrollSpy).not.toHaveBeenCalled();
    scrollSpy.mockRestore();
  });
});
