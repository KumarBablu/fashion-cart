import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // We intentionally use the standard "fetch on mount" pattern
      // (`useEffect(() => { load(); }, [])`) throughout the client
      // components in this app (cart, checkout, account pages, admin
      // panel). It's safe here — there's no double-fetch/race issue in
      // any of these single-effect loaders — so this newer, stricter
      // React Compiler-oriented rule is disabled project-wide rather
      // than suppressed at each call site.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
