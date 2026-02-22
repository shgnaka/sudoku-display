import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SideDrawer } from "../SideDrawer";
import type { NavRoute } from "../../../constants/routes";

const routes: readonly NavRoute[] = [
  { key: "storage", label: "保存管理", hash: "#/storage" },
  { key: "help", label: "ヘルプ", hash: "#/help" }
];

describe("SideDrawer", () => {
  it("does not render drawer elements when closed", () => {
    const menuButtonRef = createRef<HTMLButtonElement>();

    render(
      <>
        <button ref={menuButtonRef} type="button">
          メニュー
        </button>
        <SideDrawer
          currentRoute="solve"
          isOpen={false}
          menuButtonRef={menuButtonRef}
          routes={routes}
          onClose={vi.fn()}
          onNavigate={vi.fn()}
        />
      </>
    );

    expect(screen.queryByRole("dialog", { name: "メニュー" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("drawer-backdrop")).not.toBeInTheDocument();
  });

  it("focuses first navigation button when opened", () => {
    const menuButtonRef = createRef<HTMLButtonElement>();

    render(
      <>
        <button ref={menuButtonRef} type="button">
          メニュー
        </button>
        <SideDrawer
          currentRoute="solve"
          isOpen
          menuButtonRef={menuButtonRef}
          routes={routes}
          onClose={vi.fn()}
          onNavigate={vi.fn()}
        />
      </>
    );

    expect(screen.getByRole("button", { name: "保存管理" })).toHaveFocus();
  });

  it("restores focus to menu button on backdrop close", () => {
    const menuButtonRef = createRef<HTMLButtonElement>();
    const onClose = vi.fn();

    render(
      <>
        <button ref={menuButtonRef} type="button">
          メニュー
        </button>
        <SideDrawer
          currentRoute="solve"
          isOpen
          menuButtonRef={menuButtonRef}
          routes={routes}
          onClose={onClose}
          onNavigate={vi.fn()}
        />
      </>
    );

    fireEvent.click(screen.getByTestId("drawer-backdrop"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "メニュー" })).toHaveFocus();
  });

  it("restores focus to menu button after navigation", () => {
    const menuButtonRef = createRef<HTMLButtonElement>();
    const onNavigate = vi.fn();

    render(
      <>
        <button ref={menuButtonRef} type="button">
          メニュー
        </button>
        <SideDrawer
          currentRoute="solve"
          isOpen
          menuButtonRef={menuButtonRef}
          routes={routes}
          onClose={vi.fn()}
          onNavigate={onNavigate}
        />
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: "ヘルプ" }));

    expect(onNavigate).toHaveBeenCalledWith("help");
    expect(screen.getByRole("button", { name: "メニュー" })).toHaveFocus();
  });
});
