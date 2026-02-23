import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { cellLabel, renderApp, resetAppTestState } from "../../test-utils/renderApp";

describe("Sudoku UI editing", () => {
  beforeEach(() => {
    resetAppTestState();
  });

  it("uses readable aria-label with coordinate and state", () => {
    renderApp();

    const givenCell = screen.getByLabelText(cellLabel(1, 1));
    const editableCell = screen.getByLabelText(cellLabel(1, 3)) as HTMLInputElement;

    expect(givenCell).toHaveAttribute("aria-label", "1行1列、初期値、編集不可（初期値）");
    expect(editableCell).toHaveAttribute("aria-label", "1行3列、空、編集可能");

    fireEvent.change(editableCell, { target: { value: "4" } });
    expect(editableCell).toHaveAttribute("aria-label", "1行3列、ユーザー入力、編集可能");

    fireEvent.click(screen.getByRole("button", { name: "確認モード切替（現在: OFF）" }));
    expect(editableCell).toHaveAttribute("aria-label", "1行3列、ユーザー入力、編集不可（確認モード）");
  });

  it("keeps given cells read-only", () => {
    renderApp();

    const givenCell = screen.getByLabelText(cellLabel(1, 1)) as HTMLInputElement;
    expect(givenCell.readOnly).toBe(true);
  });

  it("allows editing empty cells", () => {
    renderApp();

    const editableCell = screen.getByLabelText(cellLabel(1, 3)) as HTMLInputElement;
    expect(editableCell.readOnly).toBe(false);

    fireEvent.change(editableCell, { target: { value: "4" } });

    expect(editableCell.value).toBe("4");
    expect(editableCell).toHaveAttribute("aria-label", "1行3列、ユーザー入力、編集可能");
  });

  it("selects all text when an editable cell gets focus", () => {
    renderApp();

    const editableCell = screen.getByLabelText(cellLabel(1, 3)) as HTMLInputElement;
    fireEvent.change(editableCell, { target: { value: "4" } });

    fireEvent.focus(editableCell);

    expect(editableCell.selectionStart).toBe(0);
    expect(editableCell.selectionEnd).toBe(1);
  });

  it("keeps full selection after mouse up on an editable cell", () => {
    renderApp();

    const editableCell = screen.getByLabelText(cellLabel(1, 3)) as HTMLInputElement;
    fireEvent.change(editableCell, { target: { value: "4" } });

    fireEvent.focus(editableCell);
    fireEvent.mouseUp(editableCell);

    expect(editableCell.selectionStart).toBe(0);
    expect(editableCell.selectionEnd).toBe(1);
  });
});
