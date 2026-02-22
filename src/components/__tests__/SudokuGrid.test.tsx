import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App";

const { generateSudokuMock, keyboardInsetState } = vi.hoisted(() => ({
  generateSudokuMock: vi.fn(),
  keyboardInsetState: { value: 0 }
}));

vi.mock("../../wasm/sudokuGenerator", () => ({
  generateSudoku: generateSudokuMock
}));

vi.mock("../../lib/useKeyboardInset", () => ({
  useKeyboardInset: () => keyboardInsetState.value
}));

function clickNav(label: string): void {
  const buttons = screen.getAllByRole("button", { name: label });
  fireEvent.click(buttons[0]);
}

function cellLabel(row: number, col: number): RegExp {
  return new RegExp(`^${row}行${col}列、`);
}

describe("Sudoku UI", () => {
  let isMobileViewport = false;
  let isSheetInputViewport = false;

  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = "#/solve";
    generateSudokuMock.mockReset();
    keyboardInsetState.value = 0;
    isMobileViewport = false;
    isSheetInputViewport = false;

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches:
          query === "(max-width: 768px)"
            ? isMobileViewport
            : query === "(max-width: 1024px)"
              ? isSheetInputViewport
              : false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false
      }))
    });
  });

  it("renders a 9x9 grid on solve page", () => {
    render(<App />);

    const cells = screen.getAllByRole("textbox");
    expect(cells).toHaveLength(81);
  });

  it("normalizes empty hash to #/solve without breaking initial render", async () => {
    window.location.hash = "";
    render(<App />);

    await waitFor(() => {
      expect(window.location.hash).toBe("#/solve");
    });

    expect(screen.getAllByRole("textbox")).toHaveLength(81);
  });

  it("shows not found page for unknown hash and keeps URL", () => {
    window.location.hash = "#/unknown";
    render(<App />);

    expect(screen.getByRole("heading", { name: "ページが見つかりません" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#/unknown");
  });

  it("keeps known hash route on initial load", () => {
    window.location.hash = "#/manage";
    render(<App />);

    expect(screen.getByRole("heading", { name: "問題生成（Rust + WASM）" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#/manage");
  });

  it("uses readable aria-label with coordinate and state", () => {
    render(<App />);

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
    render(<App />);

    const givenCell = screen.getByLabelText(cellLabel(1, 1)) as HTMLInputElement;
    expect(givenCell.readOnly).toBe(true);
  });

  it("allows editing empty cells and marks as user", () => {
    render(<App />);

    const editableCell = screen.getByLabelText(cellLabel(1, 3)) as HTMLInputElement;
    expect(editableCell.readOnly).toBe(false);

    fireEvent.change(editableCell, { target: { value: "4" } });

    expect(editableCell.value).toBe("4");
    expect(editableCell.className).toContain("origin-user");
  });

  it("selects all text when an editable cell gets focus", () => {
    render(<App />);

    const editableCell = screen.getByLabelText(cellLabel(1, 3)) as HTMLInputElement;
    fireEvent.change(editableCell, { target: { value: "4" } });

    fireEvent.focus(editableCell);

    expect(editableCell.selectionStart).toBe(0);
    expect(editableCell.selectionEnd).toBe(1);
  });

  it("keeps full selection after mouse up on an editable cell", () => {
    render(<App />);

    const editableCell = screen.getByLabelText(cellLabel(1, 3)) as HTMLInputElement;
    fireEvent.change(editableCell, { target: { value: "4" } });

    fireEvent.focus(editableCell);
    fireEvent.mouseUp(editableCell);

    expect(editableCell.selectionStart).toBe(0);
    expect(editableCell.selectionEnd).toBe(1);
  });

  it("shows an error and keeps board when puzzle input becomes invalid", async () => {
    render(<App />);
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
    const first = render(<App />);

    const editableCell = screen.getByLabelText(cellLabel(1, 3)) as HTMLInputElement;
    fireEvent.change(editableCell, { target: { value: "4" } });
    expect(editableCell.value).toBe("4");

    first.unmount();

    render(<App />);

    const restoredCell = screen.getByLabelText(cellLabel(1, 3)) as HTMLInputElement;
    expect(restoredCell.value).toBe("4");
    expect(restoredCell.className).toContain("origin-user");
  });

  it("disables grid interaction in review mode", () => {
    render(<App />);

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
    expect(document.querySelector(".mode-slot-placeholder")).not.toBeInTheDocument();
  });

  it("locks page movement only while review mode is enabled", () => {
    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 120
    });

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "確認モード切替（現在: OFF）" }));

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 580
    });
    fireEvent.scroll(window);

    expect(scrollSpy).toHaveBeenCalledWith(0, 120);

    scrollSpy.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "確認モード切替（現在: ON）" }));
    fireEvent.scroll(window);
    expect(scrollSpy).not.toHaveBeenCalled();

    scrollSpy.mockRestore();
  });

  it("shows float ink actions only while ink mode is on", () => {
    render(<App />);

    expect(document.querySelector(".solve-mode-slot")).toBeInTheDocument();
    expect(document.querySelector(".mode-slot-placeholder")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "手書き操作" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "手書きモード切替（現在: OFF）" }));

    expect(screen.getByRole("region", { name: "手書き操作" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ブロック消去" })).toBeInTheDocument();
    expect(document.querySelector(".mode-slot-placeholder")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "手書きモード切替（現在: ON）" }));
    expect(screen.queryByRole("region", { name: "手書き操作" })).not.toBeInTheDocument();
    expect(document.querySelector(".mode-slot-placeholder")).toBeInTheDocument();
  });

  it("hides float ink actions while keyboard inset is active", () => {
    keyboardInsetState.value = 240;
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "手書きモード切替（現在: OFF）" }));
    expect(screen.queryByRole("region", { name: "手書き操作" })).not.toBeInTheDocument();
  });

  it("shows only solve and manage in bottom tab bar", () => {
    isMobileViewport = true;
    isSheetInputViewport = true;
    render(<App />);

    const tab = screen.getByRole("navigation", { name: "ページナビゲーション" });
    expect(within(tab).getByRole("button", { name: "解く" })).toBeInTheDocument();
    expect(within(tab).getByRole("button", { name: "作問" })).toBeInTheDocument();
    expect(within(tab).queryByRole("button", { name: "保存管理" })).not.toBeInTheDocument();
    expect(within(tab).queryByRole("button", { name: "ヘルプ" })).not.toBeInTheDocument();
  });

  it("keeps legend available as collapsible content in solve-no-scroll layout", () => {
    isMobileViewport = true;
    render(<App />);

    const summary = screen.getByText("マスの色分けを表示");
    const legend = summary.closest("details") as HTMLDetailsElement;
    expect(legend).not.toBeNull();
    expect(legend).not.toHaveAttribute("open");

    fireEvent.click(summary);
    expect(legend).toHaveAttribute("open");
  });

  it("limits mobile drawer items to storage and help", () => {
    isMobileViewport = true;
    isSheetInputViewport = true;
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));

    const drawerNav = screen.getByRole("navigation", { name: "アプリメニュー" });
    expect(within(drawerNav).getByRole("button", { name: "保存管理" })).toBeInTheDocument();
    expect(within(drawerNav).getByRole("button", { name: "ヘルプ" })).toBeInTheDocument();
    expect(within(drawerNav).queryByRole("button", { name: "解く" })).not.toBeInTheDocument();
    expect(within(drawerNav).queryByRole("button", { name: "作問" })).not.toBeInTheDocument();
  });

  it("toggles menu button label and expanded state while drawer is open", () => {
    render(<App />);

    const openButton = screen.getByRole("button", { name: "メニューを開く" });
    expect(openButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(openButton);

    const closeButton = screen.getByRole("button", { name: "メニューを閉じる" });
    expect(closeButton).toHaveAttribute("aria-expanded", "true");
    expect(closeButton.className).toContain("open");
    expect(screen.queryByRole("button", { name: "閉じる" })).not.toBeInTheDocument();
  });

  it("closes drawer on Escape key press", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
    expect(screen.getByRole("button", { name: "メニューを閉じる" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.getByRole("button", { name: "メニューを開く" })).toBeInTheDocument();
  });

  it("resets window scroll to top when navigating to solve", () => {
    window.location.hash = "#/manage";
    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    render(<App />);
    expect(screen.getByRole("heading", { name: "問題生成（Rust + WASM）" })).toBeInTheDocument();

    clickNav("解く");

    expect(scrollSpy).toHaveBeenCalledWith(0, 0);
    scrollSpy.mockRestore();
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

    const editableCell = screen.getByLabelText(cellLabel(1, 3)) as HTMLInputElement;
    fireEvent.change(editableCell, { target: { value: "4" } });
    expect(editableCell.className).toContain("origin-user");

    clickNav("作問");
    fireEvent.click(screen.getByRole("button", { name: "新しい問題を生成" }));

    clickNav("解く");

    await waitFor(() => {
      expect(screen.getByLabelText(cellLabel(1, 1))).toHaveValue("1");
    });

    expect(screen.getByLabelText(cellLabel(1, 3))).toHaveValue("3");
    expect(generateSudokuMock).toHaveBeenCalledTimes(1);
  });

  it("navigates from not found page back to solve", async () => {
    window.location.hash = "#/unknown";
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "解くへ戻る" }));

    await waitFor(() => {
      expect(window.location.hash).toBe("#/solve");
    });
    expect(screen.getAllByRole("textbox")).toHaveLength(81);
  });

  it("uses number pad input on sheet viewport", () => {
    isSheetInputViewport = true;
    render(<App />);

    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(document.querySelector(".solve-input-sheet-slot")).toBeInTheDocument();

    const editableCell = screen.getByLabelText(cellLabel(1, 3));
    fireEvent.click(editableCell);
    fireEvent.click(screen.getByRole("button", { name: "数字 4" }));

    expect(editableCell.className).toContain("origin-user");
    expect(editableCell).toHaveTextContent("4");
  });

  it("keeps number pad in a single row with 1-9 and backspace", () => {
    isSheetInputViewport = true;
    render(<App />);

    const pad = screen.getByRole("region", { name: "数字入力" });
    const keys = within(pad).getAllByRole("button");
    expect(keys).toHaveLength(10);
    expect(within(pad).getByRole("button", { name: "数字を消去" })).toBeInTheDocument();
  });

  it("keeps sheet slot reserved when number pad is hidden in ink mode", () => {
    isSheetInputViewport = true;
    render(<App />);

    expect(document.querySelector(".solve-number-pad")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "手書きモード切替（現在: OFF）" }));

    expect(document.querySelector(".solve-input-sheet-slot")).toBeInTheDocument();
    expect(document.querySelector(".solve-number-pad-placeholder")).toBeInTheDocument();
  });

  it("disables number keys and backspace while review mode is enabled", () => {
    isSheetInputViewport = true;
    render(<App />);

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
    isSheetInputViewport = true;
    render(<App />);

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
    isSheetInputViewport = true;
    render(<App />);

    const editableCell = screen.getByLabelText(cellLabel(1, 3));
    fireEvent.click(editableCell);
    expect(editableCell.className).toContain("is-selected");

    fireEvent.click(editableCell);
    expect(editableCell.className).not.toContain("is-selected");
  });

  it("deselects a sheet cell when tapping outside grid except number pad", () => {
    isSheetInputViewport = true;
    render(<App />);

    const editableCell = screen.getByLabelText(cellLabel(1, 3));
    fireEvent.click(editableCell);
    expect(editableCell.className).toContain("is-selected");

    fireEvent.click(screen.getByText("盤面"));
    expect(editableCell.className).not.toContain("is-selected");

    fireEvent.click(editableCell);
    fireEvent.click(screen.getByRole("button", { name: "数字 4" }));
    expect(editableCell.className).toContain("is-selected");
  });

  it("deselects current sheet selection when tapping a given cell", () => {
    isSheetInputViewport = true;
    render(<App />);

    const editableCell = screen.getByLabelText(cellLabel(1, 3));
    fireEvent.click(editableCell);
    expect(editableCell.className).toContain("is-selected");

    fireEvent.click(screen.getByLabelText(cellLabel(1, 1)));
    expect(editableCell.className).not.toContain("is-selected");
  });

  it("clears selection when review mode or ink mode gets enabled", () => {
    isSheetInputViewport = true;
    render(<App />);

    const editableCell = screen.getByLabelText(cellLabel(1, 3));
    fireEvent.click(editableCell);
    expect(editableCell.className).toContain("is-selected");

    fireEvent.click(screen.getByRole("button", { name: "確認モード切替（現在: OFF）" }));
    expect(editableCell.className).not.toContain("is-selected");

    fireEvent.click(screen.getByRole("button", { name: "確認モード切替（現在: ON）" }));
    fireEvent.click(editableCell);
    expect(editableCell.className).toContain("is-selected");

    fireEvent.click(screen.getByRole("button", { name: "手書きモード切替（現在: OFF）" }));
    expect(editableCell.className).not.toContain("is-selected");
  });

  it("announces selection and input updates through aria-live in sheet mode", () => {
    isSheetInputViewport = true;
    render(<App />);

    fireEvent.click(screen.getByLabelText(cellLabel(1, 3)));
    expect(screen.getByText("1行3列を選択しました。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "数字 4" }));
    expect(screen.getByText("1行3列を 4 にしました。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "数字を消去" }));
    expect(screen.getByText("1行3列を空にしました。")).toBeInTheDocument();
  });
});
