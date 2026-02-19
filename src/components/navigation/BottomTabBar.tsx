import { APP_ROUTES } from "../../lib/navigation";
import type { AppRouteKey } from "../../lib/navigation";

interface BottomTabBarProps {
  currentRoute: AppRouteKey;
  onNavigate: (route: AppRouteKey) => void;
}

export function BottomTabBar({ currentRoute, onNavigate }: BottomTabBarProps): JSX.Element {
  return (
    <nav aria-label="ページナビゲーション" className="bottom-tab-bar">
      {APP_ROUTES.filter((route) => route.mobile).map((route) => (
        <button
          className={route.key === currentRoute ? "active" : ""}
          key={route.key}
          onClick={() => onNavigate(route.key)}
          type="button"
        >
          {route.label}
        </button>
      ))}
    </nav>
  );
}
