import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      ".output/**",
      ".tanstack/**",
      ".vercel/**",
      "node_modules/**",
      "public/**",
      "drizzle/**",
      "scripts/**",
      "src/routeTree.gen.ts",
    ],
  },

  // Base config for all TS/TSX files
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off",

      // TypeScript-aware replacements for base rules
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },

  // Server code runs in Node (server functions, DB, lib)
  {
    files: ["src/server/**/*.ts", "src/lib/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },

  // Test files: relax rules that get in the way. Mocks legitimately use
  // `any` for stubbing typed modules.
  {
    files: ["src/**/*.test.{ts,tsx}", "src/test-setup.ts"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
