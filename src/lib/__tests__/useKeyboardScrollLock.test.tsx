import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useKeyboardScrollLock } from "../useKeyboardScrollLock";
import {
  createMockVisualViewport,
  installMockVisualViewport,
  setWindowScrollY,
  spyWindowScrollTo
} from "../../test-utils/browserMocks";

describe("useKeyboardScrollLock", () => {
  beforeEach(() => {
    setWindowScrollY(120);
  });

  it("does not lock scroll when disabled", () => {
    const scrollSpy = spyWindowScrollTo();

    renderHook(() => useKeyboardScrollLock({ enabled: false, keyboardInset: 220 }));

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(scrollSpy).not.toHaveBeenCalled();
    scrollSpy.mockRestore();
  });

  it("locks window scroll when enabled and keyboard inset is positive", () => {
    const viewport = createMockVisualViewport(800);
    installMockVisualViewport(viewport);

    const scrollSpy = spyWindowScrollTo();

    renderHook(() => useKeyboardScrollLock({ enabled: true, keyboardInset: 220 }));

    setWindowScrollY(560);

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
    const scrollSpy = spyWindowScrollTo();

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
