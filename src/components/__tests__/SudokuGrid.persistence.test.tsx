import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  cellLabel,
  clickNav,
  generateSudokuMock,
  renderApp,
  resetAppTestState
} from "../../test-utils/renderApp";

describe("Sudoku UI persistence", () => {
  beforeEach(() => {
    resetAppTestState();
  });

  it("shows an error and keeps board when puzzle input becomes invalid", async () => {
    renderApp();
    clickNav("作問");

    const textarea = screen.getByLabelText("puzzle-input");

    fireEvent.change(textarea, { target: { value: "1 2 3" } });

    expect(screen.getByRole("alert")).toBeInTheDocument();

    clickNav("解く");

    await waitFor(() => {
      expect((screen.getByLabelText(cellLabel(1, 1)) as HTMLInputElement).value).toBe("5");
    });
  });

  it("keeps user input after reload", () => {
    const first = renderApp();

    const editableCell = screen.getByLabelText(cellLabel(1, 3)) as HTMLInputElement;
    fireEvent.change(editableCell, { target: { value: "4" } });
    expect(editableCell.value).toBe("4");

    first.unmount();

    renderApp();

    const restoredCell = screen.getByLabelText(cellLabel(1, 3)) as HTMLInputElement;
    expect(restoredCell.value).toBe("4");
    expect(restoredCell).toHaveAttribute("aria-label", "1行3列、ユーザー入力、編集可能");
  });

  it("generates puzzle via wasm bridge and updates board", async () => {
    const puzzle = new Uint8Array(81);
    puzzle[0] = 1;
    puzzle[1] = 2;
    puzzle[2] = 3;
    puzzle[3] = 4;
    puzzle[4] = 5;
    puzzle[5] = 6;
    puzzle[6] = 7;
    puzzle[7] = 8;
    puzzle[8] = 9;

    generateSudokuMock.mockResolvedValue({
      puzzle,
      solution: puzzle,
      clues: 9,
      difficulty: "hard",
      seed: 10n
    });

    renderApp();

    const editableCell = screen.getByLabelText(cellLabel(1, 3)) as HTMLInputElement;
    fireEvent.change(editableCell, { target: { value: "4" } });
    expect(editableCell).toHaveAttribute("aria-label", "1行3列、ユーザー入力、編集可能");

    clickNav("作問");
    fireEvent.click(screen.getByRole("button", { name: "新しい問題を生成" }));

    clickNav("解く");

    await waitFor(() => {
      expect(screen.getByLabelText(cellLabel(1, 1))).toHaveValue("1");
    });

    expect(screen.getByLabelText(cellLabel(1, 3))).toHaveValue("3");
    expect(generateSudokuMock).toHaveBeenCalledTimes(1);
  });
});
