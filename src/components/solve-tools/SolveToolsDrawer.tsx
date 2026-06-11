import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { SolveToolsPanel } from "./SolveToolsPanel";

interface SolveToolsDrawerProps {
  isOpen: boolean;
  solveButtonRef: RefObject<HTMLButtonElement>;
  onClose: () => void;
}

export function SolveToolsDrawer({
  isOpen,
  solveButtonRef,
  onClose
}: SolveToolsDrawerProps): JSX.Element | null {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      onClose();
      solveButtonRef.current?.focus();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, solveButtonRef]);

  if (!isOpen) {
    return null;
  }

  const closeWithFocusRestore = (): void => {
    onClose();
    solveButtonRef.current?.focus();
  };

  return (
    <>
      <div className="solve-tools-backdrop" onClick={closeWithFocusRestore} />
      <aside
        aria-label="解答ツール"
        aria-modal="true"
        className="solve-tools-drawer"
        ref={dialogRef}
        role="dialog"
      >
        <div className="solve-tools-drawer-header">
          <h2>解答ツール</h2>
          <button className="btn btn--inactive" onClick={closeWithFocusRestore} type="button">
            閉じる
          </button>
        </div>
        <SolveToolsPanel />
      </aside>
    </>
  );
}
