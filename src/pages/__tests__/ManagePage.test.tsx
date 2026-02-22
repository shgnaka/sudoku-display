import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SUDOKU_DIFFICULTIES } from "../../constants/difficulty";
import { ManagePage } from "../ManagePage";

vi.mock("../../state/SudokuAppStateProvider", () => ({
  useSudokuAppState: () => ({
    rawInput: "",
    setRawInput: vi.fn(),
    difficulty: "medium",
    setDifficulty: vi.fn(),
    isGenerating: false,
    handleGeneratePuzzle: vi.fn(async () => undefined),
    generationError: "",
    errorMessage: ""
  })
}));

vi.mock("../../components/PuzzleInput", () => ({
  PuzzleInput: ({ value }: { value: string }) => (
    <textarea aria-label="puzzle-input" readOnly value={value} />
  )
}));

describe("ManagePage", () => {
  it("renders difficulty options from SUDOKU_DIFFICULTIES", () => {
    render(<ManagePage />);

    const select = screen.getByLabelText("難易度");
    const options = within(select).getAllByRole("option");
    const values = options.map((option) => option.getAttribute("value"));

    expect(values).toEqual([...SUDOKU_DIFFICULTIES]);
  });
});
