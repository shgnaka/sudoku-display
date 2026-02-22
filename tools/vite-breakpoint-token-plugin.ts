import { MOBILE_BREAKPOINT_PX } from "../src/constants/layout";
import type { Plugin } from "vite";

const MOBILE_BREAKPOINT_TOKEN = "__MOBILE_BREAKPOINT_PX__";
const MOBILE_BREAKPOINT_VALUE = `${MOBILE_BREAKPOINT_PX}px`;

function isCssModuleId(id: string): boolean {
  return /\.css($|\?)/.test(id);
}

export function breakpointTokenPlugin(): Plugin {
  return {
    name: "breakpoint-token-plugin",
    enforce: "pre",
    transform(code, id) {
      if (!isCssModuleId(id) || !code.includes(MOBILE_BREAKPOINT_TOKEN)) {
        return null;
      }

      return {
        code: code.replaceAll(MOBILE_BREAKPOINT_TOKEN, MOBILE_BREAKPOINT_VALUE),
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

        output.source = output.source.replaceAll(MOBILE_BREAKPOINT_TOKEN, MOBILE_BREAKPOINT_VALUE);

        if (output.source.includes(MOBILE_BREAKPOINT_TOKEN)) {
          this.error(
            `Unresolved CSS breakpoint token ${MOBILE_BREAKPOINT_TOKEN} found in ${output.fileName}.`
          );
        }
      }
    }
  };
}
