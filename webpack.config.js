import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commonConfig = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
};

export default [
  {
    ...commonConfig,
    name: "syntaxer",
    entry: "./lib/parser.ts",
    output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "build/syntaxer"),
      library: "syntaxer",
      clean: true,
    },
  },
  {
    ...commonConfig,
    name: "benchmarks",
    entry: "./benchmarks/benchmarks.ts",
    target: "node",
    output: {
      filename: "benchmarks.cjs",
      path: path.resolve(__dirname, "build/benchmarks"),
      libraryTarget: "commonjs",
      clean: true,
    },
  },
];
