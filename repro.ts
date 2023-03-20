import { ESLint } from "eslint";
import ts from "typescript";
import {
  createSystem,
  createVirtualCompilerHost,
  createDefaultMapFromCDN,
} from "@typescript/vfs";

const compilerOptions = { target: ts.ScriptTarget.ES2018 };

const fsMap = await createDefaultMapFromCDN(
  compilerOptions,
  "4.9.4",
  false,
  ts
);
fsMap.set("index.ts", "export {}; var o = 1; let a = 1; console.log(a);");
const system = createSystem(fsMap);
const host = createVirtualCompilerHost(system, compilerOptions, ts);

const program = ts.createProgram(
  [...fsMap.keys()],
  compilerOptions,
  host.compilerHost
);

// needed only on windows
program.getSourceFile = (
  (original) =>
  (fileName, ...args) =>
    original.call(program, fileName.replace(/^\w:\\/i, "/"), ...args)
)(program.getSourceFile);

const eslint = new ESLint({
  overrideConfig: {
    rules: { "prefer-const": "error", "no-var": "error" },
    parser: "@typescript-eslint/parser",
    parserOptions: { sourceType: "module", programs: [program] },
  },
  useEslintrc: false,
  fix: true,
  cache: false,
});

const result = await eslint.lintText(fsMap.get("index.ts"), {
  filePath: "/index.ts",
});

console.log(result[0].output);
// prints: export {}; let o = 1; constststststststststst a = 1; console.log(a);
