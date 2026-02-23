import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { cellLabel, renderApp, resetAppTestState } from "../../test-utils/renderApp";
import { setWindowScrollY, spyWindowScrollTo } from "../../test-utils/browserMocks";

describe("Sudoku UI review mode", () => {
  beforeEach(() => {
    resetAppTestState();
  });

  it("disables grid interaction in review mode", () => {
    renderApp();

    const editableCell = screen.getByLabelText(cellLabel(1, 3)) as HTMLInputElement;
    fireEvent.change(editableCell, { target: { value: "4" } });
    expect(editableCell.value).toBe("4");

    fireEvent.click(screen.getByRole("button", { name: "確認モード切替（現在: OFF）" }));

    expect(editableCell.readOnly).toBe(true);
    expect(editableCell.tabIndex).toBe(-1);

    fireEvent.change(editableCell, { target: { value: "8" } });
    expect(editableCell.value).toBe("4");

    const inkToggle = screen.getByRole("button", { name: "確認モード中は手書きモード無効" });
    expect(inkToggle).toBeDisabled();
    expect(screen.queryByRole("region", { name: "手書き操作" })).not.toBeInTheDocument();
    expect(screen.getByText("確認モード中: 盤面操作と画面移動をロック中です。")).toBeInTheDocument();
  });

  it("locks page movement only while review mode is enabled", () => {
    const scrollSpy = spyWindowScrollTo();
    setWindowScrollY(120);

    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "確認モード切替（現在: OFF）" }));

    setWindowScrollY(580);
    fireEvent.scroll(window);

    expect(scrollSpy).toHaveBeenCalledWith(0, 120);

    scrollSpy.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "確認モード切替（現在: ON）" }));
    fireEvent.scroll(window);
    expect(scrollSpy).not.toHaveBeenCalled();

    scrollSpy.mockRestore();
  });

  it("shows float ink actions only while ink mode is on", () => {
    renderApp();

    expect(screen.queryByRole("region", { name: "手書き操作" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "手書きモード切替（現在: OFF）" }));

    expect(screen.getByRole("region", { name: "手書き操作" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ブロック消去" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "手書きモード切替（現在: ON）" }));
    expect(screen.queryByRole("region", { name: "手書き操作" })).not.toBeInTheDocument();
  });

  it("hides float ink actions while keyboard inset is active", () => {
    renderApp({ keyboardInset: 240 });

    fireEvent.click(screen.getByRole("button", { name: "手書きモード切替（現在: OFF）" }));
    expect(screen.queryByRole("region", { name: "手書き操作" })).not.toBeInTheDocument();
  });
});
