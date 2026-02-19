import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useReviewScrollLock } from "../useReviewScrollLock";

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

describe("useReviewScrollLock", () => {
  beforeEach(() => {
    document.body.className = "";
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 120
    });
  });

  it("does not lock movement when disabled", () => {
    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    renderHook(() => useReviewScrollLock(false));

    const event = new Event("touchmove", { cancelable: true });
    window.dispatchEvent(event);
    window.dispatchEvent(new Event("scroll"));

    expect(event.defaultPrevented).toBe(false);
    expect(scrollSpy).not.toHaveBeenCalled();
    expect(document.body.classList.contains("review-scroll-lock")).toBe(false);
    scrollSpy.mockRestore();
  });

  it("locks scroll and touch/wheel movement when enabled", () => {
    const viewport = mockVisualViewport();
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: viewport as unknown as VisualViewport
    });

    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    renderHook(() => useReviewScrollLock(true));

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 540
    });

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(scrollSpy).toHaveBeenCalledWith(0, 120);

    const touchMove = new Event("touchmove", { cancelable: true });
    window.dispatchEvent(touchMove);
    expect(touchMove.defaultPrevented).toBe(true);

    const wheel = new Event("wheel", { cancelable: true });
    window.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(true);

    act(() => {
      viewport.emit("resize");
    });
    expect(scrollSpy).toHaveBeenLastCalledWith(0, 120);
    expect(document.body.classList.contains("review-scroll-lock")).toBe(true);
    scrollSpy.mockRestore();
  });

  it("releases lock after disable", () => {
    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    const { rerender } = renderHook(({ enabled }) => useReviewScrollLock(enabled), {
      initialProps: { enabled: true }
    });

    rerender({ enabled: false });

    const touchMove = new Event("touchmove", { cancelable: true });
    window.dispatchEvent(touchMove);
    window.dispatchEvent(new Event("scroll"));

    expect(touchMove.defaultPrevented).toBe(false);
    expect(scrollSpy).not.toHaveBeenCalled();
    expect(document.body.classList.contains("review-scroll-lock")).toBe(false);
    scrollSpy.mockRestore();
  });
});
