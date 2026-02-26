import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { clickNav, renderApp, resetAppTestState } from "../../test-utils/renderApp";
import { spyWindowScrollTo } from "../../test-utils/browserMocks";

describe("Sudoku UI routing", () => {
  beforeEach(() => {
    resetAppTestState();
  });

  it("renders a 9x9 grid on solve page", () => {
    renderApp();

    expect(screen.getAllByRole("textbox")).toHaveLength(81);
  });

  it("normalizes empty hash to #/solve without breaking initial render", async () => {
    renderApp({ route: "" });

    await waitFor(() => {
      expect(window.location.hash).toBe("#/solve");
    });

    expect(screen.getAllByRole("textbox")).toHaveLength(81);
  });

  it("shows not found page for unknown hash and keeps URL", () => {
    renderApp({ route: "#/unknown" });

    expect(screen.getByRole("heading", { name: "ページが見つかりません" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#/unknown");
  });

  it("keeps known hash route on initial load", () => {
    renderApp({ route: "#/manage" });

    expect(screen.getByRole("heading", { name: "問題生成（Rust + WASM）" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#/manage");
  });

  it("renders help page on help route", () => {
    renderApp({ route: "#/help" });

    expect(screen.getByRole("heading", { name: "使い方" })).toBeInTheDocument();
  });

  it("renders storage page on storage route", () => {
    renderApp({ route: "#/storage" });

    expect(screen.getByRole("heading", { name: "保存データ管理" })).toBeInTheDocument();
  });

  it("shows only solve and manage in bottom tab bar", () => {
    renderApp({ isMobile: true, isSheetInput: true });

    const tab = screen.getByRole("navigation", { name: "ページナビゲーション" });
    expect(within(tab).getByRole("button", { name: "解く" })).toBeInTheDocument();
    expect(within(tab).getByRole("button", { name: "作問" })).toBeInTheDocument();
    expect(within(tab).queryByRole("button", { name: "保存管理" })).not.toBeInTheDocument();
    expect(within(tab).queryByRole("button", { name: "ヘルプ" })).not.toBeInTheDocument();
  });

  it("does not render legend in solve-no-scroll layout", () => {
    renderApp({ isMobile: true });

    expect(screen.queryByText("マスの色分けを表示")).not.toBeInTheDocument();
  });

  it("does not render legend in desktop layout", () => {
    renderApp();

    expect(screen.queryByText("マスの色分けを表示")).not.toBeInTheDocument();
  });

  it("does not apply solve-no-scroll on iPad-like devices", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)"
    });
    Object.defineProperty(window.navigator, "platform", {
      configurable: true,
      value: "iPad"
    });
    Object.defineProperty(window.navigator, "maxTouchPoints", {
      configurable: true,
      value: 5
    });

    renderApp({ isMobile: true });

    expect(document.querySelector(".app-root.solve-no-scroll")).toBeNull();
    expect(document.body.classList.contains("solve-no-scroll-body")).toBe(false);
  });

  it("limits mobile drawer items to storage and help", () => {
    renderApp({ isMobile: true, isSheetInput: true });

    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));

    const drawerNav = screen.getByRole("navigation", { name: "アプリメニュー" });
    expect(within(drawerNav).getByRole("button", { name: "保存管理" })).toBeInTheDocument();
    expect(within(drawerNav).getByRole("button", { name: "ヘルプ" })).toBeInTheDocument();
    expect(within(drawerNav).queryByRole("button", { name: "解く" })).not.toBeInTheDocument();
    expect(within(drawerNav).queryByRole("button", { name: "作問" })).not.toBeInTheDocument();
  });

  it("toggles menu button label and expanded state while drawer is open", () => {
    renderApp();

    const openButton = screen.getByRole("button", { name: "メニューを開く" });
    expect(openButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(openButton);

    const closeButton = screen.getByRole("button", { name: "メニューを閉じる" });
    expect(closeButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("button", { name: "閉じる" })).not.toBeInTheDocument();
  });

  it("closes drawer when menu toggle is pressed again", () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
    fireEvent.click(screen.getByRole("button", { name: "メニューを閉じる" }));

    expect(screen.getByRole("button", { name: "メニューを開く" })).toBeInTheDocument();
  });

  it("closes drawer on Escape key press", () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
    expect(screen.getByRole("button", { name: "メニューを閉じる" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.getByRole("button", { name: "メニューを開く" })).toBeInTheDocument();
  });

  it("resets window scroll to top when navigating to solve", () => {
    const scrollSpy = spyWindowScrollTo();
    renderApp({ route: "#/manage" });

    expect(screen.getByRole("heading", { name: "問題生成（Rust + WASM）" })).toBeInTheDocument();

    clickNav("解く");

    expect(scrollSpy).toHaveBeenCalledWith(0, 0);
    scrollSpy.mockRestore();
  });

  it("does not rewrite hash when navigating to current route", () => {
    renderApp({ route: "#/solve" });

    const initialHash = window.location.hash;
    clickNav("解く");

    expect(window.location.hash).toBe(initialHash);
  });

  it("navigates from not found page back to solve", async () => {
    renderApp({ route: "#/unknown" });

    fireEvent.click(screen.getByRole("button", { name: "解くへ戻る" }));

    await waitFor(() => {
      expect(window.location.hash).toBe("#/solve");
    });
    expect(screen.getAllByRole("textbox")).toHaveLength(81);
  });
});
