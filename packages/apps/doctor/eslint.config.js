import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      boundaries,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "feature", pattern: "src/features/*", mode: "folder", capture: ["feature"] },
        { type: "shared", pattern: "src/components/**" },
        { type: "shared", pattern: "src/{hooks,utils,constants,types,styles}/**" },
        { type: "infra", pattern: "src/{services,lib}/**" },
      ],
      "boundaries/include": ["src/**/*"],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react-hooks/static-components": "off",
      "react-hooks/use-memo": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/immutability": "off",
      "react-hooks/globals": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-render": "off",
      "react-hooks/unsupported-syntax": "off",
      "react-hooks/config": "off",
      "react-hooks/gating": "off",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: "app", allow: ["app", "feature", "shared", "infra"] },
            { from: "feature", allow: ["shared", "infra", "feature"] },
            { from: "shared", allow: ["shared", "infra"] },
            { from: "infra", allow: ["infra", "shared"] },
          ],
        },
      ],
      "boundaries/entry-point": [
        "error",
        {
          default: "allow",
          rules: [{ target: "feature", allow: "index.ts" }],
        },
      ],
    },
  },
  eslintConfigPrettier,
);
