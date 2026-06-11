import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createSolvedBoardFixture, createSolvedPuzzleTextFixture } from "../../test-utils/storageFixtures";
import { HistoryPage } from "../HistoryPage";
import type { SolvedPuzzleHistoryEntry } from "../../lib/historyStorage";

function createEntry(): SolvedPuzzleHistoryEntry {
  return {
    attemptId: "history-entry",
    puzzleId: "puzzle-id",
    puzzle: createSolvedPuzzleTextFixture({ row: 8, col: 8 }),
    generatedAt: "2026-06-10T10:00:00.000Z",
    completedBoard: createSolvedBoardFixture(),
    completedAt: "2026-06-10T12:00:00.000Z",
    elapsedMs: 125_000,
    difficulty: "hard"
  };
}

describe("HistoryPage", () => {
  it("shows an empty state", () => {
    render(<HistoryPage entries={[]} />);

    expect(screen.getByRole("heading", { name: "問題履歴" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("まだ問題履歴はありません。");
  });

  it("renders each history entry with useful metadata", () => {
    render(<HistoryPage entries={[createEntry()]} />);

    expect(screen.getByText("1件の履歴")).toBeInTheDocument();
    const article = screen.getByRole("article", { name: "2026年6月10日に解いた問題" });
    expect(within(article).getByText("難易度 上級")).toBeInTheDocument();
    expect(within(article).getByText("ヒント 80個")).toBeInTheDocument();
    expect(within(article).getByText("所要時間 02:05")).toBeInTheDocument();
    expect(within(article).getByText("開始 2026/6/10 19:00")).toHaveAttribute(
      "datetime",
      "2026-06-10T10:00:00.000Z"
    );
    expect(within(article).getByText("完了 2026/6/10 21:00")).toHaveAttribute(
      "datetime",
      "2026-06-10T12:00:00.000Z"
    );
  });

  it("shows an incomplete generated puzzle", () => {
    const entry: SolvedPuzzleHistoryEntry = {
      attemptId: "generated-entry",
      puzzleId: "puzzle-id",
      puzzle: createSolvedPuzzleTextFixture({ row: 8, col: 8 }),
      generatedAt: "2026-06-10T10:00:00.000Z",
      difficulty: "hard"
    };

    render(<HistoryPage entries={[entry]} />);

    const article = screen.getByRole("article", { name: "2026年6月10日に生成した問題、未完了" });
    expect(within(article).getByText("未完了")).toBeInTheDocument();
    expect(within(article).queryByText(/完了 2026/)).not.toBeInTheDocument();
    expect(within(article).getByRole("grid", { name: "問題盤面" })).toBeInTheDocument();
  });

  it("exposes the completed board as a 9 by 9 grid", () => {
    render(<HistoryPage entries={[createEntry()]} />);

    const grid = screen.getByRole("grid", { name: "完成盤面" });
    expect(within(grid).getAllByRole("row")).toHaveLength(9);
    expect(within(grid).getAllByRole("gridcell")).toHaveLength(81);
    expect(within(grid).getByRole("gridcell", { name: "1行1列、初期数字5" })).toHaveTextContent("5");
  });

  it("preserves newest-first order from its entries", () => {
    const newer = { ...createEntry(), attemptId: "newer", completedAt: "2026-06-11T12:00:00.000Z" };
    const older = { ...createEntry(), attemptId: "older", completedAt: "2026-06-10T12:00:00.000Z" };

    render(<HistoryPage entries={[newer, older]} />);

    const articles = within(screen.getByRole("list", { name: "問題履歴一覧" })).getAllByRole("article");
    expect(within(articles[0]).getByText("完了 2026/6/11 21:00")).toBeInTheDocument();
    expect(within(articles[1]).getByText("完了 2026/6/10 21:00")).toBeInTheDocument();
  });

  it("offers separate view and retry actions for a completed attempt", () => {
    const onViewEntry = vi.fn();
    const onRetryEntry = vi.fn();
    const entry = createEntry();
    render(
      <HistoryPage entries={[entry]} onRetryEntry={onRetryEntry} onViewEntry={onViewEntry} />
    );

    fireEvent.click(screen.getByRole("button", { name: "盤面を見る" }));
    fireEvent.click(screen.getByRole("button", { name: "もう一度解く" }));

    expect(onViewEntry).toHaveBeenCalledWith(entry);
    expect(onRetryEntry).toHaveBeenCalledWith(entry);
  });
});
