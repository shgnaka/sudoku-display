import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
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
  toggleInkMode: () => void;
  setIsGridEditing: (value: boolean) => void;
  setActiveBlockId: (value: BlockId) => void;
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

type SolveMode = "normal" | "ink" | "review";

interface SolveModeState {
  mode: SolveMode;
}

type SolveModeAction =
  | { type: "TOGGLE_INK" }
  | { type: "TOGGLE_REVIEW" }
  | { type: "EXIT_INK" }
  | { type: "EXIT_REVIEW" }
  | { type: "RESET_MODES" };

const initialSolveModeState: SolveModeState = { mode: "normal" };

function solveModeReducer(state: SolveModeState, action: SolveModeAction): SolveModeState {
  switch (action.type) {
    case "TOGGLE_INK":
      if (state.mode === "review") {
        return state;
      }
      return { mode: state.mode === "ink" ? "normal" : "ink" };
    case "TOGGLE_REVIEW":
      return { mode: state.mode === "review" ? "normal" : "review" };
    case "EXIT_INK":
      return state.mode === "ink" ? { mode: "normal" } : state;
    case "EXIT_REVIEW":
      return state.mode === "review" ? { mode: "normal" } : state;
    case "RESET_MODES":
      return initialSolveModeState;
    default:
      return state;
  }
}

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
  const [modeState, dispatchMode] = useReducer(solveModeReducer, initialSolveModeState);
  const [isGridEditing, setIsGridEditing] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<BlockId>("0-0");
  const [inkState, setInkState] = useState<InkState>(() => createEmptyInkState());
  const shouldKeepPersistedBoardRef = useRef(Boolean(persistedGame));
  const isInkMode = modeState.mode === "ink";
  const isReviewMode = modeState.mode === "review";

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

  const toggleInkMode = (): void => {
    dispatchMode({ type: "TOGGLE_INK" });
  };

  const toggleReviewMode = (): void => {
    if (!isReviewMode) {
      setIsGridEditing(false);
    }
    dispatchMode({ type: "TOGGLE_REVIEW" });
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
    dispatchMode({ type: "EXIT_REVIEW" });
    shouldKeepPersistedBoardRef.current = false;
  };

  const clearInkData = (): void => {
    setInkState(clearAll());
    clearInkState();
    dispatchMode({ type: "EXIT_INK" });
  };

  const clearAllStoredData = (): void => {
    clearGameState();
    clearInkState();
    setRawInput(DEFAULT_PUZZLE_TEXT);
    setBoard(getDefaultBoard());
    setInkState(clearAll());
    setErrorMessage("");
    setGenerationError("");
    dispatchMode({ type: "RESET_MODES" });
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
    toggleInkMode,
    setIsGridEditing,
    setActiveBlockId,
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
