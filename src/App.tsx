import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { AppHeader } from "./components/navigation/AppHeader";
import { BottomTabBar } from "./components/navigation/BottomTabBar";
import { SideDrawer } from "./components/navigation/SideDrawer";
import { APP_ROUTES, DEFAULT_ROUTE_KEY, MOBILE_DRAWER_ROUTES } from "./constants/routes";
import { getRouteHash, normalizeRouteHash } from "./lib/navigation";
import { useIsMobileViewport } from "./lib/useIsMobileViewport";
import { HelpPage } from "./pages/HelpPage";
import { ManagePage } from "./pages/ManagePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SolvePage } from "./pages/SolvePage";
import { StoragePage } from "./pages/StoragePage";
import { SudokuAppStateProvider } from "./state/SudokuAppStateProvider";
import type { AppRouteKey } from "./constants/routes";

function readCurrentRoute(): AppRouteKey {
  if (typeof window === "undefined") {
    return DEFAULT_ROUTE_KEY;
  }

  return normalizeRouteHash(window.location.hash);
}

function AppBody(): JSX.Element {
  const [currentRoute, setCurrentRoute] = useState<AppRouteKey>(() => readCurrentRoute());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobileViewport();
  const isSolveRoute = currentRoute === "solve";
  const shouldUseSolveNoScroll = isSolveRoute && isMobile;

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
    return isMobile ? MOBILE_DRAWER_ROUTES : APP_ROUTES;
  }, [isMobile]);

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

  const navigate = (route: AppRouteKey): void => {
    if (typeof window === "undefined") {
      return;
    }

    setCurrentRoute(route);
    setIsDrawerOpen(false);

    const nextHash = getRouteHash(route);
    if (window.location.hash === nextHash) {
      return;
    }

    window.location.hash = nextHash;
  };

  const renderPage = (): JSX.Element => {
    switch (currentRoute) {
      case "manage":
        return <ManagePage />;
      case "help":
        return <HelpPage />;
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
        isMenuOpen={isDrawerOpen}
        menuButtonRef={menuButtonRef}
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
      <section className="content-area">{renderPage()}</section>
      <BottomTabBar currentRoute={currentRoute} onNavigate={navigate} />
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
