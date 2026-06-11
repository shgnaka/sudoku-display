import { MOBILE_BREAKPOINT_PX, SOLVE_INPUT_SHEET_BREAKPOINT_PX } from "../src/constants/layout";
import type { Plugin } from "vite";

const MOBILE_BREAKPOINT_TOKEN = "__MOBILE_BREAKPOINT_PX__";
const MOBILE_BREAKPOINT_VALUE = `${MOBILE_BREAKPOINT_PX}px`;
const TABLET_BREAKPOINT_TOKEN = "__TABLET_BREAKPOINT_PX__";
const TABLET_BREAKPOINT_VALUE = `${SOLVE_INPUT_SHEET_BREAKPOINT_PX}px`;
const BREAKPOINT_REPLACEMENTS = [
  [MOBILE_BREAKPOINT_TOKEN, MOBILE_BREAKPOINT_VALUE],
  [TABLET_BREAKPOINT_TOKEN, TABLET_BREAKPOINT_VALUE]
] as const;

function replaceBreakpointTokens(source: string): string {
  return BREAKPOINT_REPLACEMENTS.reduce(
    (result, [token, value]) => result.replaceAll(token, value),
    source
  );
}

function isCssModuleId(id: string): boolean {
  return /\.css($|\?)/.test(id);
}

export function breakpointTokenPlugin(): Plugin {
  return {
    name: "breakpoint-token-plugin",
    enforce: "pre",
    transform(code, id) {
      if (
        !isCssModuleId(id) ||
        !BREAKPOINT_REPLACEMENTS.some(([token]) => code.includes(token))
      ) {
        return null;
      }

      return {
        code: replaceBreakpointTokens(code),
        map: null
      };
    },
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== "asset") {
          continue;
        }

        if (typeof output.source !== "string" || !output.fileName.endsWith(".css")) {
          continue;
        }

        output.source = replaceBreakpointTokens(output.source);

        for (const [token] of BREAKPOINT_REPLACEMENTS) {
          if (output.source.includes(token)) {
            this.error(`Unresolved CSS breakpoint token ${token} found in ${output.fileName}.`);
          }
        }
      }
    }
  };
}
