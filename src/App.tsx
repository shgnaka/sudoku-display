import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { AppHeader } from "./components/navigation/AppHeader";
import { BottomTabBar } from "./components/navigation/BottomTabBar";
import { SideDrawer } from "./components/navigation/SideDrawer";
import { SolveToolsDrawer } from "./components/solve-tools/SolveToolsDrawer";
import { APP_ROUTES, DEFAULT_ROUTE_KEY, MOBILE_DRAWER_ROUTES } from "./constants/routes";
import { getRouteHash, normalizeRouteHash } from "./lib/navigation";
import { loadSolvedPuzzleHistory } from "./lib/historyStorage";
import { useSolveInputSheetViewport } from "./lib/useSolveInputSheetViewport";
import { useShouldUseSolveNoScroll } from "./lib/useShouldUseSolveNoScroll";
import { HelpPage } from "./pages/HelpPage";
import { HistoryPage } from "./pages/HistoryPage";
import { ManagePage } from "./pages/ManagePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SolvePage } from "./pages/SolvePage";
import { StoragePage } from "./pages/StoragePage";
import { SudokuAppStateProvider, useSudokuAppState } from "./state/SudokuAppStateProvider";
import type { AppRouteKey } from "./constants/routes";
import type { SolvedPuzzleHistoryEntry } from "./lib/historyStorage";

function readCurrentRoute(): AppRouteKey {
  if (typeof window === "undefined") {
    return DEFAULT_ROUTE_KEY;
  }

  return normalizeRouteHash(window.location.hash);
}

function AppBody(): JSX.Element {
  const [currentRoute, setCurrentRoute] = useState<AppRouteKey>(() => readCurrentRoute());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSolveToolsOpen, setIsSolveToolsOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<SolvedPuzzleHistoryEntry[]>(() =>
    loadSolvedPuzzleHistory()
  );
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const solveButtonRef = useRef<HTMLButtonElement>(null);
  const routeBeforeHistoryRef = useRef<AppRouteKey>(DEFAULT_ROUTE_KEY);
  const { isTimerCompleted, loadHistoryEntry, retryHistoryEntry } = useSudokuAppState();
  const isTabletOrMobile = useSolveInputSheetViewport();
  const isSolveRoute = currentRoute === "solve";
  const shouldUseSolveNoScroll = useShouldUseSolveNoScroll(isSolveRoute);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!window.location.hash) {
      window.history.replaceState(null, "", getRouteHash(DEFAULT_ROUTE_KEY));
      setCurrentRoute(DEFAULT_ROUTE_KEY);
    }

    const syncRoute = (): void => {
      setCurrentRoute(readCurrentRoute());
    };

    window.addEventListener("hashchange", syncRoute);
    return () => {
      window.removeEventListener("hashchange", syncRoute);
    };
  }, []);

  const currentLabel = useMemo(() => {
    if (currentRoute === "notFound") {
      return "ページが見つかりません";
    }

    return APP_ROUTES.find((route) => route.key === currentRoute)?.label ?? "解く";
  }, [currentRoute]);

  const drawerRoutes = useMemo(() => {
    return isTabletOrMobile ? MOBILE_DRAWER_ROUTES : APP_ROUTES;
  }, [isTabletOrMobile]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.classList.toggle("solve-no-scroll-body", shouldUseSolveNoScroll);

    return () => {
      document.body.classList.remove("solve-no-scroll-body");
    };
  }, [shouldUseSolveNoScroll]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.scrollTo(0, 0);
  }, [currentRoute]);

  useEffect(() => {
    if (currentRoute === "history") {
      setHistoryEntries(loadSolvedPuzzleHistory());
    }
  }, [currentRoute]);

  useEffect(() => {
    if (typeof window === "undefined" || !isDrawerOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }

      setIsDrawerOpen(false);
      menuButtonRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isDrawerOpen]);

  const closeDrawer = (): void => {
    setIsDrawerOpen(false);
    menuButtonRef.current?.focus();
  };

  const toggleDrawer = (): void => {
    if (isDrawerOpen) {
      closeDrawer();
      return;
    }

    setIsDrawerOpen(true);
  };

  const toggleHistory = (): void => {
    if (currentRoute === "history") {
      navigate(routeBeforeHistoryRef.current);
      return;
    }

    routeBeforeHistoryRef.current = currentRoute === "notFound" ? DEFAULT_ROUTE_KEY : currentRoute;
    navigate("history");
  };

  const navigate = (route: AppRouteKey): void => {
    if (typeof window === "undefined") {
      return;
    }

    setCurrentRoute(route);
    setIsDrawerOpen(false);
    setIsSolveToolsOpen(false);

    const nextHash = getRouteHash(route);
    if (window.location.hash === nextHash) {
      return;
    }

    window.location.hash = nextHash;
  };

  const viewHistoryEntry = (entry: SolvedPuzzleHistoryEntry): void => {
    loadHistoryEntry(entry);
    navigate("solve");
  };

  const retryHistory = (entry: SolvedPuzzleHistoryEntry): void => {
    retryHistoryEntry(entry);
    navigate("solve");
  };

  const renderPage = (): JSX.Element => {
    switch (currentRoute) {
      case "manage":
        return <ManagePage />;
      case "help":
        return <HelpPage />;
      case "history":
        return (
          <HistoryPage
            entries={historyEntries}
            onRetryEntry={retryHistory}
            onViewEntry={viewHistoryEntry}
          />
        );
      case "storage":
        return <StoragePage />;
      case "notFound":
        return <NotFoundPage onBackToSolve={() => navigate("solve")} />;
      case "solve":
      default:
        return <SolvePage />;
    }
  };

  return (
    <main className={shouldUseSolveNoScroll ? "app-root solve-no-scroll" : "app-root"}>
      <AppHeader
        compact={isSolveRoute}
        currentLabel={currentLabel}
        isHistoryActive={currentRoute === "history"}
        isMenuOpen={isDrawerOpen}
        menuButtonRef={menuButtonRef}
        onToggleHistory={toggleHistory}
        onToggleMenu={toggleDrawer}
      />
      <SideDrawer
        currentRoute={currentRoute}
        isOpen={isDrawerOpen}
        menuButtonRef={menuButtonRef}
        routes={drawerRoutes}
        onClose={closeDrawer}
        onNavigate={navigate}
      />
      {isTabletOrMobile && !isTimerCompleted && (
        <SolveToolsDrawer
          isOpen={isSolveToolsOpen}
          onClose={() => setIsSolveToolsOpen(false)}
          solveButtonRef={solveButtonRef}
        />
      )}
      <section className="content-area">{renderPage()}</section>
      <BottomTabBar
        currentRoute={currentRoute}
        onNavigate={navigate}
        onOpenSolveTools={() => {
          if (!isTimerCompleted) {
            setIsSolveToolsOpen(true);
          }
        }}
        solveButtonRef={solveButtonRef}
      />
    </main>
  );
}

function App(): JSX.Element {
  return (
    <SudokuAppStateProvider>
      <AppBody />
    </SudokuAppStateProvider>
  );
}

export default App;
