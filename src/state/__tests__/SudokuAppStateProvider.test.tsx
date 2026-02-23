import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SudokuAppStateProvider, useSudokuAppState } from "../SudokuAppStateProvider";
import { clearStorage } from "../../test-utils/browserMocks";

function wrapper({ children }: { children: ReactNode }): JSX.Element {
  return <SudokuAppStateProvider>{children}</SudokuAppStateProvider>;
}

describe("SudokuAppStateProvider mode machine", () => {
  beforeEach(() => {
    clearStorage();
  });

  it("toggles ink mode between normal and ink", () => {
    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    expect(result.current.isInkMode).toBe(false);
    expect(result.current.isReviewMode).toBe(false);

    act(() => {
      result.current.toggleInkMode();
    });

    expect(result.current.isInkMode).toBe(true);
    expect(result.current.isReviewMode).toBe(false);

    act(() => {
      result.current.toggleInkMode();
    });

    expect(result.current.isInkMode).toBe(false);
    expect(result.current.isReviewMode).toBe(false);
  });

  it("switches to review mode and clears ink mode", () => {
    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    act(() => {
      result.current.toggleInkMode();
    });
    expect(result.current.isInkMode).toBe(true);

    act(() => {
      result.current.toggleReviewMode();
    });

    expect(result.current.isReviewMode).toBe(true);
    expect(result.current.isInkMode).toBe(false);
  });

  it("keeps review mode when ink toggle is requested during review", () => {
    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    act(() => {
      result.current.toggleReviewMode();
    });
    expect(result.current.isReviewMode).toBe(true);

    act(() => {
      result.current.toggleInkMode();
    });

    expect(result.current.isReviewMode).toBe(true);
    expect(result.current.isInkMode).toBe(false);
  });
});
