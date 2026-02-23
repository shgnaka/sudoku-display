import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useReviewScrollLock } from "../useReviewScrollLock";
import {
  createMockVisualViewport,
  installMockVisualViewport,
  setWindowScrollY,
  spyWindowScrollTo
} from "../../test-utils/browserMocks";

describe("useReviewScrollLock", () => {
  beforeEach(() => {
    document.body.className = "";
    setWindowScrollY(120);
  });

  it("does not lock movement when disabled", () => {
    const scrollSpy = spyWindowScrollTo();

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
    const viewport = createMockVisualViewport(800);
    installMockVisualViewport(viewport);

    const scrollSpy = spyWindowScrollTo();
    renderHook(() => useReviewScrollLock(true));

    setWindowScrollY(540);

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
    const scrollSpy = spyWindowScrollTo();
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
