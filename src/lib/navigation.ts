export const APP_ROUTES = [
  { key: "solve", label: "解く", hash: "#/solve" },
  { key: "manage", label: "作問", hash: "#/manage" },
  { key: "storage", label: "保存管理", hash: "#/storage" },
  { key: "help", label: "ヘルプ", hash: "#/help" }
] as const;

export type NavRoute = (typeof APP_ROUTES)[number];
export type NavRouteKey = (typeof APP_ROUTES)[number]["key"];
export type AppRouteKey = NavRouteKey | "notFound";

export const BOTTOM_TAB_ROUTES = APP_ROUTES.filter(
  (route) => route.key === "solve" || route.key === "manage"
);

export const MOBILE_DRAWER_ROUTES = APP_ROUTES.filter(
  (route) => route.key === "storage" || route.key === "help"
);

const ROUTE_BY_HASH = new Map<string, NavRouteKey>(
  APP_ROUTES.map((route) => [route.hash, route.key])
);

export function normalizeRouteHash(hash: string): AppRouteKey {
  if (!hash) {
    return "solve";
  }

  return ROUTE_BY_HASH.get(hash) ?? "notFound";
}

export function getRouteHash(route: AppRouteKey): string {
  if (route === "notFound") {
    return "#/solve";
  }

  const found = APP_ROUTES.find((item) => item.key === route);
  return found?.hash ?? "#/solve";
}
