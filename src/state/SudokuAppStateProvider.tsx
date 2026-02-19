import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { DEFAULT_PUZZLE_TEXT } from "../lib/defaultPuzzle";
import { clearGameState, loadGameState, saveGameState } from "../lib/gameStorage";
import { appendStroke, clearAll, clearBlock, createEmptyInkState } from "../lib/inkModel";
import { clearInkState, loadInkState, saveInkState } from "../lib/inkStorage";
import { line81ToPuzzleText } from "../lib/sudokuFormatter";
import { parseSudokuText } from "../lib/sudokuParser";
import { setUserCell } from "../lib/sudokuModel";
import { generateSudoku } from "../wasm/sudokuGenerator";
import type { SudokuDifficulty } from "../wasm/sudokuGenerator";
import type { BlockId, InkState, Stroke } from "../types/ink";
import type { Board } from "../types/sudoku";

interface SudokuAppState {
  rawInput: string;
  board: Board;
  errorMessage: string;
  generationError: string;
  isGenerating: boolean;
  difficulty: SudokuDifficulty;
  isInkMode: boolean;
  isGridEditing: boolean;
  isReviewMode: boolean;
  activeBlockId: BlockId;
  inkState: InkState;
  setRawInput: (value: string) => void;
  setDifficulty: (value: SudokuDifficulty) => void;
  setIsInkMode: (value: boolean) => void;
  setIsGridEditing: (value: boolean) => void;
  setActiveBlockId: (value: BlockId) => void;
  setIsReviewMode: (value: boolean) => void;
  handleCellChange: (row: number, col: number, value: number | null) => void;
  handleCommitStroke: (blockId: BlockId, stroke: Stroke) => void;
  handleClearActiveBlock: () => void;
  handleClearAllInk: () => void;
  toggleReviewMode: () => void;
  handleGeneratePuzzle: () => Promise<void>;
  resetGameData: () => void;
  clearInkData: () => void;
  clearAllStoredData: () => void;
}

const SudokuAppStateContext = createContext<SudokuAppState | null>(null);

function emptyBoard(): Board {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => ({ value: null, origin: "empty" as const }))
  );
}

function getDefaultBoard(): Board {
  const parsed = parseSudokuText(DEFAULT_PUZZLE_TEXT);
  return parsed.ok ? parsed.board : emptyBoard();
}

export function SudokuAppStateProvider({ children }: { children: ReactNode }): JSX.Element {
  const persistedGame = useMemo(() => loadGameState(), []);
  const [rawInput, setRawInput] = useState(persistedGame?.rawInput ?? DEFAULT_PUZZLE_TEXT);
  const [board, setBoard] = useState<Board>(() => persistedGame?.board ?? getDefaultBoard());
  const [errorMessage, setErrorMessage] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [difficulty, setDifficulty] = useState<SudokuDifficulty>("medium");
  const [isInkMode, setIsInkMode] = useState(false);
  const [isGridEditing, setIsGridEditing] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<BlockId>("0-0");
  const [inkState, setInkState] = useState<InkState>(() => createEmptyInkState());
  const shouldKeepPersistedBoardRef = useRef(Boolean(persistedGame));

  useEffect(() => {
    setInkState(loadInkState());
  }, []);

  useEffect(() => {
    saveInkState(inkState);
  }, [inkState]);

  useEffect(() => {
    saveGameState({ rawInput, board });
  }, [rawInput, board]);

  useEffect(() => {
    const result = parseSudokuText(rawInput);

    if (result.ok) {
      if (shouldKeepPersistedBoardRef.current) {
        shouldKeepPersistedBoardRef.current = false;
        setErrorMessage("");
        return;
      }

      setBoard(result.board);
      setErrorMessage("");
      return;
    }

    shouldKeepPersistedBoardRef.current = false;
    setErrorMessage(result.error);
  }, [rawInput]);

  const handleCellChange = (row: number, col: number, value: number | null): void => {
    setBoard((current) => setUserCell(current, row, col, value));
  };

  const handleCommitStroke = (blockId: BlockId, stroke: Stroke): void => {
    setInkState((current) => appendStroke(current, blockId, stroke));
  };

  const handleClearActiveBlock = (): void => {
    setInkState((current) => clearBlock(current, activeBlockId));
  };

  const handleClearAllInk = (): void => {
    setInkState(clearAll());
    clearInkState();
  };

  const toggleReviewMode = (): void => {
    setIsReviewMode((prev) => {
      const next = !prev;
      if (next) {
        setIsInkMode(false);
        setIsGridEditing(false);
      }
      return next;
    });
  };

  const handleGeneratePuzzle = async (): Promise<void> => {
    setIsGenerating(true);
    setGenerationError("");

    try {
      const generated = await generateSudoku(difficulty);
      const generatedText = line81ToPuzzleText(generated.puzzle);
      setRawInput(generatedText);
      setInkState(clearAll());
      clearInkState();
    } catch (error) {
      const message = error instanceof Error ? error.message : "数独の生成に失敗しました。";
      setGenerationError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetGameData = (): void => {
    clearGameState();
    setRawInput(DEFAULT_PUZZLE_TEXT);
    setBoard(getDefaultBoard());
    setErrorMessage("");
    setGenerationError("");
    setIsReviewMode(false);
    shouldKeepPersistedBoardRef.current = false;
  };

  const clearInkData = (): void => {
    setInkState(clearAll());
    clearInkState();
    setIsInkMode(false);
  };

  const clearAllStoredData = (): void => {
    clearGameState();
    clearInkState();
    setRawInput(DEFAULT_PUZZLE_TEXT);
    setBoard(getDefaultBoard());
    setInkState(clearAll());
    setErrorMessage("");
    setGenerationError("");
    setIsInkMode(false);
    setIsReviewMode(false);
    setIsGridEditing(false);
    shouldKeepPersistedBoardRef.current = false;
  };

  const value: SudokuAppState = {
    rawInput,
    board,
    errorMessage,
    generationError,
    isGenerating,
    difficulty,
    isInkMode,
    isGridEditing,
    isReviewMode,
    activeBlockId,
    inkState,
    setRawInput,
    setDifficulty,
    setIsInkMode,
    setIsGridEditing,
    setActiveBlockId,
    setIsReviewMode,
    handleCellChange,
    handleCommitStroke,
    handleClearActiveBlock,
    handleClearAllInk,
    toggleReviewMode,
    handleGeneratePuzzle,
    resetGameData,
    clearInkData,
    clearAllStoredData
  };

  return <SudokuAppStateContext.Provider value={value}>{children}</SudokuAppStateContext.Provider>;
}

export function useSudokuAppState(): SudokuAppState {
  const context = useContext(SudokuAppStateContext);
  if (!context) {
    throw new Error("useSudokuAppState must be used within SudokuAppStateProvider");
  }

  return context;
}
