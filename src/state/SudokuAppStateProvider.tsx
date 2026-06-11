import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import { DEFAULT_SUDOKU_DIFFICULTY } from "../constants/difficulty";
import { DEFAULT_ACTIVE_BLOCK_ID } from "../constants/ink";
import { SUDOKU_SIZE } from "../constants/sudokuDomain";
import { createAttemptId } from "../lib/attemptId";
import { DEFAULT_PUZZLE_FALLBACK_TEXT, loadDefaultPuzzleText } from "../lib/defaultPuzzle";
import { clearGameState, loadGameState, saveGameState } from "../lib/gameStorage";
import {
  clearSolvedPuzzleHistory,
  completePuzzleHistory,
  recordGeneratedPuzzle,
  recordSolvedPuzzle
} from "../lib/historyStorage";
import { appendStroke, clearAll, clearBlock, createEmptyInkState } from "../lib/inkModel";
import { clearInkState, loadInkState, saveInkState } from "../lib/inkStorage";
import { line81ToPuzzleText } from "../lib/sudokuFormatter";
import { parseSudokuText } from "../lib/sudokuParser";
import { getPuzzleId, isSolvedBoard, setUserCell, solveBoard } from "../lib/sudokuModel";
import {
  clearPuzzleTimers,
  loadPuzzleTimer,
  removePuzzleTimer,
  savePuzzleTimer
} from "../lib/timerStorage";
import { generateSudoku } from "../wasm/sudokuGenerator";
import type { SudokuDifficulty } from "../constants/difficulty";
import type { SolvedPuzzleHistoryEntry } from "../lib/historyStorage";
import type { PersistedPuzzleTimer } from "../lib/timerStorage";
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
  isTimerPaused: boolean;
  isTimerCompleted: boolean;
  elapsedSeconds: number;
  answerCheckMessage: string;
  invalidCellKeys: ReadonlySet<string>;
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
  toggleTimerPause: () => void;
  checkAnswers: () => void;
  handleGeneratePuzzle: () => Promise<void>;
  loadHistoryEntry: (entry: SolvedPuzzleHistoryEntry) => void;
  retryHistoryEntry: (entry: SolvedPuzzleHistoryEntry) => void;
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
  | { type: "ENTER_REVIEW" }
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
    case "ENTER_REVIEW":
      return { mode: "review" };
    case "RESET_MODES":
      return initialSolveModeState;
    default:
      return state;
  }
}

function emptyBoard(): Board {
  return Array.from({ length: SUDOKU_SIZE }, () =>
    Array.from({ length: SUDOKU_SIZE }, () => ({ value: null, origin: "empty" as const }))
  );
}

function getDefaultBoard(defaultPuzzleText: string): Board {
  const parsed = parseSudokuText(defaultPuzzleText);
  return parsed.ok ? parsed.board : emptyBoard();
}

function getPuzzleIdentity(puzzleText: string): string {
  const parsed = parseSudokuText(puzzleText);
  return parsed.ok ? getPuzzleId(parsed.board) : "";
}

function createTimer(attemptId: string, completed: boolean): PersistedPuzzleTimer {
  if (completed) {
    return { elapsedMs: 0, status: "completed", startedAt: null };
  }

  return (
    loadPuzzleTimer(attemptId) ?? {
      elapsedMs: 0,
      status: "running",
      startedAt: Date.now()
    }
  );
}

function getElapsedMs(timer: PersistedPuzzleTimer, now: number): number {
  if (timer.status !== "running" || timer.startedAt === null) {
    return timer.elapsedMs;
  }

  return timer.elapsedMs + Math.max(0, now - timer.startedAt);
}

export function SudokuAppStateProvider({ children }: { children: ReactNode }): JSX.Element {
  const persistedGame = useMemo(() => loadGameState(), []);
  const [defaultPuzzleText, setDefaultPuzzleText] = useState(DEFAULT_PUZZLE_FALLBACK_TEXT);
  const [rawInput, setRawInputState] = useState(persistedGame?.rawInput ?? DEFAULT_PUZZLE_FALLBACK_TEXT);
  const [board, setBoard] = useState<Board>(() => persistedGame?.board ?? getDefaultBoard(DEFAULT_PUZZLE_FALLBACK_TEXT));
  const [errorMessage, setErrorMessage] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [difficulty, setDifficulty] = useState<SudokuDifficulty>(DEFAULT_SUDOKU_DIFFICULTY);
  const [modeState, dispatchMode] = useReducer(solveModeReducer, initialSolveModeState);
  const [isGridEditing, setIsGridEditing] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<BlockId>(DEFAULT_ACTIVE_BLOCK_ID);
  const [inkState, setInkState] = useState<InkState>(() => createEmptyInkState());
  const initialPuzzleId = useMemo(() => getPuzzleIdentity(rawInput), []);
  const [, setPuzzleId] = useState(initialPuzzleId);
  const puzzleIdRef = useRef(initialPuzzleId);
  const initialAttemptId = persistedGame ? (persistedGame.attemptId ?? initialPuzzleId) : createAttemptId();
  const [attemptId, setAttemptId] = useState(initialAttemptId);
  const attemptIdRef = useRef(initialAttemptId);
  const [solutionBoard, setSolutionBoard] = useState<Board | null>(() => {
    const parsed = parseSudokuText(rawInput);
    return parsed.ok ? solveBoard(parsed.board) : null;
  });
  const [timer, setTimer] = useState<PersistedPuzzleTimer>(() =>
    createTimer(initialAttemptId, isSolvedBoard(board))
  );
  const [timerNow, setTimerNow] = useState(() => Date.now());
  const [answerCheckMessage, setAnswerCheckMessage] = useState("");
  const [invalidCellKeys, setInvalidCellKeys] = useState<ReadonlySet<string>>(() => new Set());
  const shouldKeepPersistedBoardRef = useRef(Boolean(persistedGame));
  const previousSolvedRef = useRef(isSolvedBoard(board));
  const pendingUserEditRef = useRef(false);
  const isInkMode = modeState.mode === "ink";
  const isReviewMode = modeState.mode === "review";
  const isTimerPaused = timer.status === "paused";
  const isTimerCompleted = timer.status === "completed";
  const elapsedSeconds = Math.floor(getElapsedMs(timer, timerNow) / 1000);

  useEffect(() => {
    if (timer.status !== "running") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimerNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [timer.status]);

  useEffect(() => {
    if (!attemptId) {
      return;
    }

    if (timer.status === "completed") {
      removePuzzleTimer(attemptId);
      return;
    }

    savePuzzleTimer(attemptId, timer);
    return () => {
      savePuzzleTimer(attemptId, {
        ...timer,
        elapsedMs: getElapsedMs(timer, Date.now()),
        startedAt: timer.status === "running" ? Date.now() : null
      });
    };
  }, [attemptId, timer]);

  useEffect(() => {
    setInkState(loadInkState());
  }, []);

  useEffect(() => {
    if (persistedGame || import.meta.env.MODE === "test") {
      return;
    }

    let cancelled = false;

    void loadDefaultPuzzleText().then((loadedText) => {
      if (cancelled) {
        return;
      }

      setDefaultPuzzleText(loadedText);
      setRawInputState((current) => (current === DEFAULT_PUZZLE_FALLBACK_TEXT ? loadedText : current));
    });

    return () => {
      cancelled = true;
    };
  }, [persistedGame]);

  useEffect(() => {
    saveInkState(inkState);
  }, [inkState]);

  useEffect(() => {
    saveGameState({ attemptId, rawInput, board });
  }, [attemptId, rawInput, board]);

  useEffect(() => {
    const isSolved = isSolvedBoard(board);
    const shouldRecord = pendingUserEditRef.current && !previousSolvedRef.current && isSolved;

    if (shouldRecord) {
      const completedAt = Date.now();
      const record = {
        attemptId: attemptIdRef.current,
        puzzle: rawInput,
        completedBoard: board,
        completedAt: new Date(completedAt).toISOString(),
        elapsedMs: getElapsedMs(timer, completedAt)
      };

      const completedGeneratedPuzzle = completePuzzleHistory(record);
      if (!completedGeneratedPuzzle) {
        recordSolvedPuzzle(record);
      }
    }

    if (isSolved && timer.status !== "completed") {
      dispatchMode({ type: "ENTER_REVIEW" });
      setIsGridEditing(false);
      setTimer((current) => ({
        elapsedMs: getElapsedMs(current, Date.now()),
        status: "completed",
        startedAt: null
      }));
    }

    previousSolvedRef.current = isSolved;
    pendingUserEditRef.current = false;
  }, [board, rawInput, timer.status]);

  useEffect(() => {
    const result = parseSudokuText(rawInput);

    if (result.ok) {
      const nextPuzzleId = getPuzzleId(result.board);
      if (nextPuzzleId !== puzzleIdRef.current) {
        const nextAttemptId = createAttemptId();
        attemptIdRef.current = nextAttemptId;
        setAttemptId(nextAttemptId);
        puzzleIdRef.current = nextPuzzleId;
        setPuzzleId(nextPuzzleId);
        setSolutionBoard(solveBoard(result.board));
        setTimer(createTimer(nextAttemptId, false));
        setTimerNow(Date.now());
        setAnswerCheckMessage("");
        setInvalidCellKeys(new Set());
        dispatchMode({ type: "RESET_MODES" });
      }

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

  const setRawInput = (value: string): void => {
    pendingUserEditRef.current = false;
    setRawInputState(value);
  };

  const handleCellChange = (row: number, col: number, value: number | null): void => {
    if (isTimerCompleted || isReviewMode) {
      return;
    }

    const changedKey = `${row}-${col}`;
    setInvalidCellKeys((current) => {
      if (!current.has(changedKey)) {
        return current;
      }
      const next = new Set(current);
      next.delete(changedKey);
      return next;
    });
    setAnswerCheckMessage("");
    pendingUserEditRef.current = true;
    setBoard((current) => {
      const next = setUserCell(current, row, col, value);
      if (next === current) {
        pendingUserEditRef.current = false;
      }
      return next;
    });
  };

  const handleCommitStroke = (blockId: BlockId, stroke: Stroke): void => {
    if (isTimerCompleted || isReviewMode) {
      return;
    }

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
    if (isTimerCompleted) {
      return;
    }

    dispatchMode({ type: "TOGGLE_INK" });
  };

  const toggleReviewMode = (): void => {
    if (isTimerCompleted) {
      return;
    }

    if (!isReviewMode) {
      setIsGridEditing(false);
    }
    dispatchMode({ type: "TOGGLE_REVIEW" });
  };

  const toggleTimerPause = (): void => {
    setTimer((current) => {
      if (current.status === "completed") {
        return current;
      }

      if (current.status === "paused") {
        const now = Date.now();
        setTimerNow(now);
        return { ...current, status: "running", startedAt: now };
      }

      const now = Date.now();
      setTimerNow(now);
      return {
        elapsedMs: getElapsedMs(current, now),
        status: "paused",
        startedAt: null
      };
    });
    setIsGridEditing(false);
  };

  const checkAnswers = (): void => {
    if (timer.status === "paused" || !solutionBoard) {
      return;
    }

    const invalid = new Set<string>();
    let hasEmpty = false;

    board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.value === null) {
          hasEmpty = true;
        } else if (cell.origin !== "given" && cell.value !== solutionBoard[rowIndex][colIndex].value) {
          invalid.add(`${rowIndex}-${colIndex}`);
        }
      });
    });

    setInvalidCellKeys(invalid);
    if (invalid.size > 0) {
      setAnswerCheckMessage(`${invalid.size}か所、入力を見直してください。`);
    } else if (hasEmpty) {
      setAnswerCheckMessage("未入力のマスがあります。");
    } else {
      setAnswerCheckMessage("正解です。");
    }
  };

  const handleGeneratePuzzle = async (): Promise<void> => {
    setIsGenerating(true);
    setGenerationError("");

    try {
      const generated = await generateSudoku(difficulty);
      const generatedText = line81ToPuzzleText(generated.puzzle);
      pendingUserEditRef.current = false;
      const nextAttemptId = createAttemptId();
      const nextPuzzleId = getPuzzleIdentity(generatedText);
      attemptIdRef.current = nextAttemptId;
      setAttemptId(nextAttemptId);
      puzzleIdRef.current = nextPuzzleId;
      setPuzzleId(nextPuzzleId);
      setTimer(createTimer(nextAttemptId, false));
      setTimerNow(Date.now());
      recordGeneratedPuzzle({
        attemptId: nextAttemptId,
        puzzle: generatedText,
        generatedAt: new Date().toISOString(),
        difficulty: generated.difficulty
      });
      setRawInputState(generatedText);
      setSolutionBoard(
        generated.solution.length === SUDOKU_SIZE * SUDOKU_SIZE
          ? generated.solution.reduce<Board>((rows, value, index) => {
              const row = Math.floor(index / SUDOKU_SIZE);
              const col = index % SUDOKU_SIZE;
              if (!rows[row]) {
                rows[row] = [];
              }
              rows[row][col] = {
                value,
                origin: generated.puzzle[index] === 0 ? "user" : "given"
              };
              return rows;
            }, [])
          : null
      );
      setInkState(clearAll());
      clearInkState();
    } catch (error) {
      const message = error instanceof Error ? error.message : "数独の生成に失敗しました。";
      setGenerationError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadHistoryEntry = (entry: SolvedPuzzleHistoryEntry): void => {
    const parsed = parseSudokuText(entry.puzzle);
    if (!parsed.ok) {
      setErrorMessage(parsed.error);
      return;
    }

    const nextBoard = entry.completedBoard ?? parsed.board;
    const nextPuzzleId = getPuzzleId(parsed.board);
    shouldKeepPersistedBoardRef.current = Boolean(entry.completedBoard && entry.puzzle !== rawInput);
    pendingUserEditRef.current = false;
    previousSolvedRef.current = isSolvedBoard(nextBoard);
    setRawInputState(entry.puzzle);
    setBoard(nextBoard);
    puzzleIdRef.current = nextPuzzleId;
    setPuzzleId(nextPuzzleId);
    attemptIdRef.current = entry.attemptId;
    setAttemptId(entry.attemptId);
    setSolutionBoard(entry.completedBoard ?? solveBoard(parsed.board));
    setTimer(createTimer(entry.attemptId, Boolean(entry.completedBoard)));
    setTimerNow(Date.now());
    setAnswerCheckMessage("");
    setInvalidCellKeys(new Set());
    setInkState(clearAll());
    clearInkState();
    setErrorMessage("");
    setGenerationError("");
    setIsGridEditing(false);
    dispatchMode({ type: entry.completedBoard ? "ENTER_REVIEW" : "RESET_MODES" });
  };

  const retryHistoryEntry = (entry: SolvedPuzzleHistoryEntry): void => {
    const parsed = parseSudokuText(entry.puzzle);
    if (!parsed.ok) {
      setErrorMessage(parsed.error);
      return;
    }

    const nextAttemptId = createAttemptId();
    const nextPuzzleId = getPuzzleId(parsed.board);
    recordGeneratedPuzzle({
      attemptId: nextAttemptId,
      puzzle: entry.puzzle,
      generatedAt: new Date().toISOString(),
      ...(entry.difficulty ? { difficulty: entry.difficulty } : {})
    });
    shouldKeepPersistedBoardRef.current = entry.puzzle !== rawInput;
    pendingUserEditRef.current = false;
    previousSolvedRef.current = false;
    setRawInputState(entry.puzzle);
    setBoard(parsed.board);
    puzzleIdRef.current = nextPuzzleId;
    setPuzzleId(nextPuzzleId);
    attemptIdRef.current = nextAttemptId;
    setAttemptId(nextAttemptId);
    setSolutionBoard(solveBoard(parsed.board));
    const now = Date.now();
    setTimer({ elapsedMs: 0, status: "running", startedAt: now });
    setTimerNow(now);
    setAnswerCheckMessage("");
    setInvalidCellKeys(new Set());
    setInkState(clearAll());
    clearInkState();
    setErrorMessage("");
    setGenerationError("");
    setIsGridEditing(false);
    dispatchMode({ type: "RESET_MODES" });
  };

  const resetGameData = (): void => {
    clearGameState();
    setRawInputState(defaultPuzzleText);
    setBoard(getDefaultBoard(defaultPuzzleText));
    setErrorMessage("");
    setGenerationError("");
    dispatchMode({ type: "EXIT_REVIEW" });
    shouldKeepPersistedBoardRef.current = false;
    pendingUserEditRef.current = false;
    const nextPuzzleId = getPuzzleIdentity(defaultPuzzleText);
    puzzleIdRef.current = nextPuzzleId;
    setPuzzleId(nextPuzzleId);
    setSolutionBoard(solveBoard(getDefaultBoard(defaultPuzzleText)));
    const nextAttemptId = createAttemptId();
    attemptIdRef.current = nextAttemptId;
    setAttemptId(nextAttemptId);
    setTimer(createTimer(nextAttemptId, false));
    setAnswerCheckMessage("");
    setInvalidCellKeys(new Set());
  };

  const clearInkData = (): void => {
    setInkState(clearAll());
    clearInkState();
    dispatchMode({ type: "EXIT_INK" });
  };

  const clearAllStoredData = (): void => {
    clearGameState();
    clearInkState();
    clearSolvedPuzzleHistory();
    clearPuzzleTimers();
    setRawInputState(defaultPuzzleText);
    setBoard(getDefaultBoard(defaultPuzzleText));
    setInkState(clearAll());
    setErrorMessage("");
    setGenerationError("");
    dispatchMode({ type: "RESET_MODES" });
    setIsGridEditing(false);
    shouldKeepPersistedBoardRef.current = false;
    pendingUserEditRef.current = false;
    const nextPuzzleId = getPuzzleIdentity(defaultPuzzleText);
    puzzleIdRef.current = nextPuzzleId;
    setPuzzleId(nextPuzzleId);
    setSolutionBoard(solveBoard(getDefaultBoard(defaultPuzzleText)));
    const nextAttemptId = createAttemptId();
    attemptIdRef.current = nextAttemptId;
    setAttemptId(nextAttemptId);
    setTimer(createTimer(nextAttemptId, false));
    setAnswerCheckMessage("");
    setInvalidCellKeys(new Set());
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
    isTimerPaused,
    isTimerCompleted,
    elapsedSeconds,
    answerCheckMessage,
    invalidCellKeys,
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
    toggleTimerPause,
    checkAnswers,
    handleGeneratePuzzle,
    loadHistoryEntry,
    retryHistoryEntry,
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
