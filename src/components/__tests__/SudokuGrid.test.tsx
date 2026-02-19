import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App";

const { generateSudokuMock } = vi.hoisted(() => ({
  generateSudokuMock: vi.fn()
}));

vi.mock("../../wasm/sudokuGenerator", () => ({
  generateSudoku: generateSudokuMock
}));

describe("Sudoku UI", () => {
  beforeEach(() => {
    window.localStorage.clear();
    generateSudokuMock.mockReset();
  });

  it("renders a 9x9 grid", () => {
    render(<App />);

    const cells = screen.getAllByRole("textbox");
    expect(cells).toHaveLength(82); // 81 cells + 1 textarea
  });

  it("keeps given cells read-only", () => {
    render(<App />);

    const givenCell = screen.getByLabelText("r1c1") as HTMLInputElement;
    expect(givenCell.readOnly).toBe(true);
  });

  it("allows editing empty cells and marks as user", () => {
    render(<App />);

    const editableCell = screen.getByLabelText("r1c3") as HTMLInputElement;
    expect(editableCell.readOnly).toBe(false);

    fireEvent.change(editableCell, { target: { value: "4" } });

    expect(editableCell.value).toBe("4");
    expect(editableCell.className).toContain("origin-user");
  });

  it("shows an error and keeps board when puzzle input becomes invalid", () => {
    render(<App />);

    const textarea = screen.getByLabelText("puzzle-input");
    const original = screen.getByLabelText("r1c1") as HTMLInputElement;

    expect(original.value).toBe("5");

    fireEvent.change(textarea, { target: { value: "1 2 3" } });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect((screen.getByLabelText("r1c1") as HTMLInputElement).value).toBe("5");
  });

  it("keeps user input after reload", () => {
    const first = render(<App />);

    const editableCell = screen.getByLabelText("r1c3") as HTMLInputElement;
    fireEvent.change(editableCell, { target: { value: "4" } });
    expect(editableCell.value).toBe("4");

    first.unmount();

    render(<App />);

    const restoredCell = screen.getByLabelText("r1c3") as HTMLInputElement;
    expect(restoredCell.value).toBe("4");
    expect(restoredCell.className).toContain("origin-user");
  });

  it("disables grid interaction in review mode", () => {
    render(<App />);

    const editableCell = screen.getByLabelText("r1c3") as HTMLInputElement;
    fireEvent.change(editableCell, { target: { value: "4" } });
    expect(editableCell.value).toBe("4");

    fireEvent.click(screen.getByRole("button", { name: "確認モードをON" }));

    expect(editableCell.readOnly).toBe(true);
    expect(editableCell.tabIndex).toBe(-1);

    fireEvent.change(editableCell, { target: { value: "8" } });
    expect(editableCell.value).toBe("4");

    const inkToggle = screen.getByRole("button", { name: "確認モード中は描画モード無効" });
    expect(inkToggle).toBeDisabled();
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

    render(<App />);

    const editableCell = screen.getByLabelText("r1c3") as HTMLInputElement;
    fireEvent.change(editableCell, { target: { value: "4" } });
    expect(editableCell.className).toContain("origin-user");

    fireEvent.click(screen.getByRole("button", { name: "新しい問題を生成" }));

    await waitFor(() => {
      expect(screen.getByLabelText("r1c1")).toHaveValue("1");
    });

    expect(screen.getByLabelText("r1c3")).toHaveValue("3");
    expect(generateSudokuMock).toHaveBeenCalledTimes(1);
  });
});
