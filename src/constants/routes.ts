export const APP_ROUTES = [
  { key: "solve", label: "解く", hash: "#/solve" },
  { key: "manage", label: "作問", hash: "#/manage" },
  { key: "storage", label: "保存管理", hash: "#/storage" },
  { key: "help", label: "ヘルプ", hash: "#/help" }
] as const;

export type NavRoute = (typeof APP_ROUTES)[number];
export type NavRouteKey = (typeof APP_ROUTES)[number]["key"];
export type AppRouteKey = NavRouteKey | "notFound";

export const DEFAULT_ROUTE_KEY: NavRouteKey = "solve";
export const DEFAULT_ROUTE_HASH = "#/solve";

export const BOTTOM_TAB_ROUTE_KEYS: readonly NavRouteKey[] = ["solve", "manage"];
export const MOBILE_DRAWER_ROUTE_KEYS: readonly NavRouteKey[] = ["storage", "help"];

const BOTTOM_TAB_ROUTE_KEY_SET = new Set<NavRouteKey>(BOTTOM_TAB_ROUTE_KEYS);
const MOBILE_DRAWER_ROUTE_KEY_SET = new Set<NavRouteKey>(MOBILE_DRAWER_ROUTE_KEYS);

export const BOTTOM_TAB_ROUTES = APP_ROUTES.filter((route) => BOTTOM_TAB_ROUTE_KEY_SET.has(route.key));
export const MOBILE_DRAWER_ROUTES = APP_ROUTES.filter((route) => MOBILE_DRAWER_ROUTE_KEY_SET.has(route.key));
