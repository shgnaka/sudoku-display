import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../../App";

describe("Sudoku UI", () => {
  beforeEach(() => {
    window.localStorage.clear();
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
});
