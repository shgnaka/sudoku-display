import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { AppHeader } from "./components/navigation/AppHeader";
import { BottomTabBar } from "./components/navigation/BottomTabBar";
import { SideDrawer } from "./components/navigation/SideDrawer";
import { APP_ROUTES, MOBILE_DRAWER_ROUTES, getRouteHash, normalizeRouteHash } from "./lib/navigation";
import { useIsMobileViewport } from "./lib/useIsMobileViewport";
import { HelpPage } from "./pages/HelpPage";
import { ManagePage } from "./pages/ManagePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SolvePage } from "./pages/SolvePage";
import { StoragePage } from "./pages/StoragePage";
import { SudokuAppStateProvider } from "./state/SudokuAppStateProvider";
import type { AppRouteKey } from "./lib/navigation";

function readCurrentRoute(): AppRouteKey {
  if (typeof window === "undefined") {
    return "solve";
  }

  return normalizeRouteHash(window.location.hash);
}

function AppBody(): JSX.Element {
  const [currentRoute, setCurrentRoute] = useState<AppRouteKey>(() => readCurrentRoute());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useIsMobileViewport();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!window.location.hash) {
      window.history.replaceState(null, "", getRouteHash("solve"));
      setCurrentRoute("solve");
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
    <main className="app-root">
      <AppHeader currentLabel={currentLabel} onOpenMenu={() => setIsDrawerOpen(true)} />
      <SideDrawer
        currentRoute={currentRoute}
        isOpen={isDrawerOpen}
        routes={drawerRoutes}
        onClose={() => setIsDrawerOpen(false)}
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
