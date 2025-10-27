import globals from "globals";
import js from "@eslint/js";

export default [
  {
    files: ["**/*.js"],
    ignores: ["dist/**", "node_modules/**"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: js.configs.recommended.rules,
  },
];
