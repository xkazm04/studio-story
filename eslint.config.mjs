import { createRequire } from "module";

const require = createRequire(import.meta.url);
const nextConfig = require("eslint-config-next");

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/gray-\\d/]",
          message:
            "Use slate-* instead of gray-*. The project enforces a slate-only color palette.",
        },
        {
          selector: "TemplateLiteral[quasis.0.value.raw=/gray-\\d/]",
          message:
            "Use slate-* instead of gray-*. The project enforces a slate-only color palette.",
        },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Dzin engine boundary: prevent Studio Story domain code from leaking in
  // ---------------------------------------------------------------------------
  {
    files: ["packages/dzin/**/*.ts", "packages/dzin/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/app/*",
                "@/workspace/*",
                "@/manifest/*",
                "@/agents/*",
                "@/lib/*",
                "@/mcp-server/*",
                "@/cli/*",
              ],
              message:
                "Dzin engine must not import Studio Story domain code. Keep engine domain-free.",
            },
            {
              group: [
                "../../../src/*",
                "../../src/*",
                "../src/*",
                "../../../../src/*",
              ],
              message:
                "Dzin engine must not import from src/ via relative paths.",
            },
            {
              group: [
                "zustand",
                "zustand/*",
                "@supabase/*",
                "@tanstack/react-query",
                "@tanstack/react-query/*",
                "@anthropic-ai/*",
                "@google/genai",
                "@google/genai/*",
                "elevenlabs",
                "elevenlabs/*",
              ],
              message:
                "Dzin engine must not depend on domain-specific runtime libraries.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
