import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_MESSAGES } from "../../constants/messages/storage";
import { StoragePage } from "../StoragePage";

const resetGameData = vi.fn();
const clearInkData = vi.fn();
const clearAllStoredData = vi.fn();

vi.mock("../../state/SudokuAppStateProvider", () => ({
  useSudokuAppState: () => ({
    resetGameData,
    clearInkData,
    clearAllStoredData
  })
}));

describe("StoragePage", () => {
  beforeEach(() => {
    resetGameData.mockReset();
    clearInkData.mockReset();
    clearAllStoredData.mockReset();
  });

  it("cancels clear-game when confirm is false", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<StoragePage />);

    fireEvent.click(screen.getByRole("button", { name: STORAGE_MESSAGES.actions.clearGame }));

    expect(confirmSpy).toHaveBeenCalledWith(STORAGE_MESSAGES.confirm.clearGame);
    expect(resetGameData).not.toHaveBeenCalled();
  });

  it("runs clear-game when confirm is true", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<StoragePage />);

    fireEvent.click(screen.getByRole("button", { name: STORAGE_MESSAGES.actions.clearGame }));

    expect(resetGameData).toHaveBeenCalledTimes(1);
  });

  it("cancels clear-ink when confirm is false", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<StoragePage />);

    fireEvent.click(screen.getByRole("button", { name: STORAGE_MESSAGES.actions.clearInk }));

    expect(confirmSpy).toHaveBeenCalledWith(STORAGE_MESSAGES.confirm.clearInk);
    expect(clearInkData).not.toHaveBeenCalled();
  });

  it("runs clear-ink when confirm is true", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<StoragePage />);

    fireEvent.click(screen.getByRole("button", { name: STORAGE_MESSAGES.actions.clearInk }));

    expect(clearInkData).toHaveBeenCalledTimes(1);
  });

  it("cancels clear-all when confirm is false", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<StoragePage />);

    fireEvent.click(screen.getByRole("button", { name: STORAGE_MESSAGES.actions.clearAll }));

    expect(confirmSpy).toHaveBeenCalledWith(STORAGE_MESSAGES.confirm.clearAll);
    expect(clearAllStoredData).not.toHaveBeenCalled();
  });

  it("runs clear-all when confirm is true", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<StoragePage />);

    fireEvent.click(screen.getByRole("button", { name: STORAGE_MESSAGES.actions.clearAll }));

    expect(clearAllStoredData).toHaveBeenCalledTimes(1);
  });
});
