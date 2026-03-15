import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      eslintConfigPrettier,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      quotes: ["error", "double", { avoidEscape: true }],
    },
  },
  // Allow exporting column configs / variants alongside components (common pattern)
  {
    files: ["src/components/ui/button.tsx", "src/pages/MatchesPage/columns.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  // Sync from URL value to draft state in effect is intentional (controlled form).
  {
    files: ["src/components/MatchesFiltersBar/MatchesFiltersBar.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
