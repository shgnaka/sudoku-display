import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";
import type { Board } from "../../types/sudoku";

export interface SelectedCell {
  row: number;
  col: number;
}

interface UseSolveSelectionControllerArgs {
  board: Board;
  inputMode: "keyboard" | "sheet";
  isInkMode: boolean;
  isReviewMode: boolean;
  solvePageRef: RefObject<HTMLDivElement>;
  onCellChange: (row: number, col: number, value: number | null) => void;
}

interface UseSolveSelectionControllerResult {
  selectedCell: SelectedCell | null;
  sheetA11yMessage: string;
  handleSheetCellSelect: (row: number, col: number, isEditable: boolean) => void;
  handleNumberPadInput: (value: number) => void;
  handleNumberPadBackspace: () => void;
}

export function useSolveSelectionController({
  board,
  inputMode,
  isInkMode,
  isReviewMode,
  solvePageRef,
  onCellChange
}: UseSolveSelectionControllerArgs): UseSolveSelectionControllerResult {
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [sheetA11yMessage, setSheetA11yMessage] = useState("");

  const announceSheetMessage = useCallback((message: string): void => {
    setSheetA11yMessage((previous) => {
      if (previous === message) {
        return previous;
      }

      return message;
    });
  }, []);

  const describeCurrentCell = useCallback(
    (row: number, col: number): string => {
      const cell = board[row]?.[col];
      if (!cell || cell.value === null) {
        return `${row + 1}行${col + 1}列を選択。現在は空です。`;
      }

      return `${row + 1}行${col + 1}列を選択。現在の値は ${cell.value} です。`;
    },
    [board]
  );

  useEffect(() => {
    if (inputMode !== "sheet") {
      setSelectedCell(null);
      return;
    }

    if (isInkMode || isReviewMode) {
      setSelectedCell(null);
      announceSheetMessage("セル選択を解除しました。");
    }
  }, [announceSheetMessage, inputMode, isInkMode, isReviewMode]);

  useEffect(() => {
    if (inputMode !== "sheet" || selectedCell === null) {
      return;
    }

    const root = solvePageRef.current;
    if (!root) {
      return;
    }

    const onRootClick = (event: Event): void => {
      const target = event.target as Element | null;
      if (!target) {
        return;
      }

      if (target.closest(".sudoku-cell") || target.closest(".solve-number-pad")) {
        return;
      }

      setSelectedCell(null);
      announceSheetMessage("セル選択を解除しました。");
    };

    root.addEventListener("click", onRootClick, true);
    return () => {
      root.removeEventListener("click", onRootClick, true);
    };
  }, [announceSheetMessage, inputMode, selectedCell, solvePageRef]);

  const handleSheetCellSelect = useCallback(
    (row: number, col: number, isEditable: boolean): void => {
      if (!isEditable) {
        setSelectedCell(null);
        announceSheetMessage("セル選択を解除しました。");
        return;
      }

      setSelectedCell((current) => {
        if (current?.row === row && current.col === col) {
          announceSheetMessage("セル選択を解除しました。");
          return null;
        }

        announceSheetMessage(describeCurrentCell(row, col));
        return { row, col };
      });
    },
    [announceSheetMessage, describeCurrentCell]
  );

  const handleNumberPadInput = useCallback(
    (value: number): void => {
      if (!selectedCell || isReviewMode) {
        return;
      }

      onCellChange(selectedCell.row, selectedCell.col, value);
      announceSheetMessage(`${selectedCell.row + 1}行${selectedCell.col + 1}列を ${value} にしました。`);
    },
    [announceSheetMessage, isReviewMode, onCellChange, selectedCell]
  );

  const handleNumberPadBackspace = useCallback((): void => {
    if (!selectedCell || isReviewMode) {
      return;
    }

    onCellChange(selectedCell.row, selectedCell.col, null);
    announceSheetMessage(`${selectedCell.row + 1}行${selectedCell.col + 1}列を空にしました。`);
  }, [announceSheetMessage, isReviewMode, onCellChange, selectedCell]);

  return {
    selectedCell,
    sheetA11yMessage,
    handleSheetCellSelect,
    handleNumberPadInput,
    handleNumberPadBackspace
  };
}
