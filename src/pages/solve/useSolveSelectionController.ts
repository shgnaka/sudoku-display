import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";
import {
  buildSelectionAnnouncement,
  buildSelectionClearedAnnouncement,
  buildValueChangeAnnouncement
} from "../../lib/solveA11y";

export interface SelectedCell {
  row: number;
  col: number;
}

interface UseSolveSelectionControllerArgs {
  inputMode: "keyboard" | "sheet";
  isInkMode: boolean;
  isReviewMode: boolean;
  solvePageRef: RefObject<HTMLDivElement>;
  onCellChange: (row: number, col: number, value: number | null) => void;
}

interface UseSolveSelectionControllerResult {
  selectedCell: SelectedCell | null;
  sheetA11yMessage: string;
  sheetA11yRevision: number;
  handleSheetCellSelect: (row: number, col: number, isEditable: boolean) => void;
  handleNumberPadInput: (value: number) => void;
  handleNumberPadBackspace: () => void;
}

export function useSolveSelectionController({
  inputMode,
  isInkMode,
  isReviewMode,
  solvePageRef,
  onCellChange
}: UseSolveSelectionControllerArgs): UseSolveSelectionControllerResult {
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [sheetA11yMessage, setSheetA11yMessage] = useState("");
  const [sheetA11yRevision, setSheetA11yRevision] = useState(0);

  const announceSheetMessage = useCallback((message: string): void => {
    setSheetA11yMessage(message);
    setSheetA11yRevision((current) => current + 1);
  }, []);

  useEffect(() => {
    if (inputMode !== "sheet") {
      setSelectedCell(null);
      return;
    }

    if (isInkMode || isReviewMode) {
      setSelectedCell(null);
      announceSheetMessage(buildSelectionClearedAnnouncement());
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
      announceSheetMessage(buildSelectionClearedAnnouncement());
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
        announceSheetMessage(buildSelectionClearedAnnouncement());
        return;
      }

      setSelectedCell((current) => {
        if (current?.row === row && current.col === col) {
          announceSheetMessage(buildSelectionClearedAnnouncement());
          return null;
        }

        announceSheetMessage(buildSelectionAnnouncement(row, col));
        return { row, col };
      });
    },
    [announceSheetMessage]
  );

  const handleNumberPadInput = useCallback(
    (value: number): void => {
      if (!selectedCell || isReviewMode) {
        return;
      }

      onCellChange(selectedCell.row, selectedCell.col, value);
      announceSheetMessage(
        buildValueChangeAnnouncement({ row: selectedCell.row, col: selectedCell.col, value })
      );
    },
    [announceSheetMessage, isReviewMode, onCellChange, selectedCell]
  );

  const handleNumberPadBackspace = useCallback((): void => {
    if (!selectedCell || isReviewMode) {
      return;
    }

    onCellChange(selectedCell.row, selectedCell.col, null);
    announceSheetMessage(
      buildValueChangeAnnouncement({ row: selectedCell.row, col: selectedCell.col, value: null })
    );
  }, [announceSheetMessage, isReviewMode, onCellChange, selectedCell]);

  return {
    selectedCell,
    sheetA11yMessage,
    sheetA11yRevision,
    handleSheetCellSelect,
    handleNumberPadInput,
    handleNumberPadBackspace
  };
}
