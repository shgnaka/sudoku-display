import { createEvent, fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../../constants/storageKeys";
import { cellLabel, renderApp, resetAppTestState } from "../../test-utils/renderApp";

describe("Sudoku UI mobile sheet input", () => {
  beforeEach(() => {
    resetAppTestState();
  });

  it("uses number pad input on sheet viewport", () => {
    renderApp({ isSheetInput: true });

    expect(screen.queryAllByRole("textbox")).toHaveLength(0);

    const editableCell = screen.getByLabelText(cellLabel(1, 3));
    fireEvent.click(editableCell);
    fireEvent.click(screen.getByRole("button", { name: "数字 4" }));

    expect(editableCell).toHaveTextContent("4");
  });

  it("keeps number pad in a single row with 1-9 and backspace", () => {
    renderApp({ isSheetInput: true });

    const pad = screen.getByRole("region", { name: "数字入力" });
    const keys = within(pad).getAllByRole("button");
    expect(keys).toHaveLength(10);
    expect(within(pad).getByRole("button", { name: "数字を消去" })).toBeInTheDocument();
  });

  it("keeps sheet slot reserved when number pad is hidden in ink mode", () => {
    renderApp({ isSheetInput: true });

    expect(screen.getByRole("region", { name: "数字入力" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "手書きモード切替（現在: OFF）" }));

    expect(screen.getByTestId("solve-input-sheet-slot")).toBeInTheDocument();
    expect(screen.getByTestId("solve-number-pad-placeholder")).toBeInTheDocument();
  });

  it("disables number keys and backspace while review mode is enabled", () => {
    renderApp({ isSheetInput: true });

    fireEvent.click(screen.getByLabelText(cellLabel(1, 3)));
    fireEvent.click(screen.getByRole("button", { name: "数字 4" }));
    expect(screen.getByLabelText(cellLabel(1, 3))).toHaveTextContent("4");

    fireEvent.click(screen.getByRole("button", { name: "確認モード切替（現在: OFF）" }));

    const numberButton = screen.getByRole("button", { name: "数字 8" });
    const backspaceButton = screen.getByRole("button", { name: "数字を消去" });
    expect(numberButton).toBeDisabled();
    expect(backspaceButton).toBeDisabled();

    fireEvent.click(numberButton);
    fireEvent.click(backspaceButton);
    expect(screen.getByLabelText(cellLabel(1, 3))).toHaveTextContent("4");
  });

  it("supports backspace on selected sheet cell and disables it without selection", () => {
    renderApp({ isSheetInput: true });

    const backspaceButton = screen.getByRole("button", { name: "数字を消去" });
    expect(backspaceButton).toBeDisabled();

    fireEvent.click(backspaceButton);

    const editableCell = screen.getByLabelText(cellLabel(1, 3));
    fireEvent.click(editableCell);
    expect(backspaceButton).not.toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "数字 4" }));
    expect(editableCell).toHaveTextContent("4");

    fireEvent.click(backspaceButton);
    expect(editableCell).toHaveTextContent("");
  });

  it("deselects a sheet cell when tapping the same cell again", () => {
    renderApp({ isSheetInput: true });

    fireEvent.click(screen.getByLabelText(cellLabel(1, 3)));
    expect(screen.getByText("1行3列を選択しました。")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(cellLabel(1, 3)));
    expect(screen.getByText("セル選択を解除しました。")).toBeInTheDocument();
  });

  it("deselects a sheet cell when tapping outside grid except number pad", () => {
    renderApp({ isSheetInput: true });

    const editableCell = screen.getByLabelText(cellLabel(1, 3));
    const backspaceButton = screen.getByRole("button", { name: "数字を消去" });

    fireEvent.click(editableCell);
    expect(backspaceButton).not.toBeDisabled();

    fireEvent.click(screen.getByTestId("solve-page"));
    expect(backspaceButton).toBeDisabled();

    fireEvent.click(editableCell);
    fireEvent.click(screen.getByRole("button", { name: "数字 4" }));
    expect(backspaceButton).not.toBeDisabled();
  });

  it("deselects current sheet selection when tapping a given cell", () => {
    renderApp({ isSheetInput: true });

    const backspaceButton = screen.getByRole("button", { name: "数字を消去" });

    fireEvent.click(screen.getByLabelText(cellLabel(1, 3)));
    expect(backspaceButton).not.toBeDisabled();

    fireEvent.click(screen.getByLabelText(cellLabel(1, 1)));
    expect(backspaceButton).toBeDisabled();
  });

  it("announces deselection when tapping a given cell in sheet mode", () => {
    renderApp({ isSheetInput: true });

    fireEvent.click(screen.getByLabelText(cellLabel(1, 3)));
    expect(screen.getByText("1行3列を選択しました。")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(cellLabel(1, 1)));
    expect(screen.getByText("セル選択を解除しました。")).toBeInTheDocument();
  });

  it("clears selection when review mode or ink mode gets enabled", () => {
    renderApp({ isSheetInput: true });

    const editableCell = screen.getByLabelText(cellLabel(1, 3));
    const backspaceButton = screen.getByRole("button", { name: "数字を消去" });

    fireEvent.click(editableCell);
    expect(backspaceButton).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "確認モード切替（現在: OFF）" }));
    expect(backspaceButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "確認モード切替（現在: ON）" }));
    fireEvent.click(editableCell);
    expect(backspaceButton).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "手書きモード切替（現在: OFF）" }));
    expect(screen.queryByRole("button", { name: "数字を消去" })).not.toBeInTheDocument();
  });

  it("announces selection and input updates through aria-live in sheet mode", () => {
    renderApp({ isSheetInput: true });

    fireEvent.click(screen.getByLabelText(cellLabel(1, 3)));
    expect(screen.getByText("1行3列を選択しました。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "数字 4" }));
    expect(screen.getByText("1行3列を 4 にしました。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "数字を消去" }));
    expect(screen.getByText("1行3列を空にしました。")).toBeInTheDocument();
  });

  it("announces deselection when review mode or ink mode gets enabled", () => {
    renderApp({ isSheetInput: true });

    fireEvent.click(screen.getByLabelText(cellLabel(1, 3)));
    expect(screen.getByText("1行3列を選択しました。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "確認モード切替（現在: OFF）" }));
    expect(screen.getByText("セル選択を解除しました。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "確認モード切替（現在: ON）" }));
    fireEvent.click(screen.getByLabelText(cellLabel(1, 3)));
    expect(screen.getByText("1行3列を選択しました。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "手書きモード切替（現在: OFF）" }));
    expect(screen.getByText("セル選択を解除しました。")).toBeInTheDocument();
  });

  it.each([
    ["smartphone", { isMobile: true, isSheetInput: true }],
    ["tablet", { isMobile: false, isSheetInput: true }]
  ] as const)("saves a finger-drawn stroke on %s", (_label, viewport) => {
    Object.defineProperty(window.navigator, "maxTouchPoints", {
      configurable: true,
      value: 5
    });
    renderApp(viewport);
    fireEvent.click(screen.getByRole("button", { name: "手書きモード切替（現在: OFF）" }));

    const canvas = screen.getByTestId("ink-canvas-0-0");
    Object.defineProperty(canvas, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        width: 120,
        height: 120,
        top: 0,
        left: 0,
        right: 120,
        bottom: 120,
        x: 0,
        y: 0,
        toJSON: () => ({})
      })
    });

    const fireTouchPointer = (type: "pointerdown" | "pointermove" | "pointerup", x: number): void => {
      const event =
        type === "pointerdown"
          ? createEvent.pointerDown(canvas)
          : type === "pointermove"
            ? createEvent.pointerMove(canvas)
            : createEvent.pointerUp(canvas);
      Object.defineProperties(event, {
        pointerId: { value: 71 },
        pointerType: { value: "touch" },
        isPrimary: { value: true },
        clientX: { value: x },
        clientY: { value: x },
        pressure: { value: 0.5 }
      });
      fireEvent(canvas, event);
    };

    fireTouchPointer("pointerdown", 10);
    fireTouchPointer("pointermove", 30);
    fireTouchPointer("pointerup", 40);

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.ink) ?? "{}");
    expect(stored["0-0"]).toHaveLength(1);
    expect(stored["0-0"][0].points.length).toBeGreaterThan(2);
  });
});
